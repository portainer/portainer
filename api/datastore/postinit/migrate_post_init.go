package postinit

import (
	"cmp"
	"context"
	"fmt"
	"slices"

	"github.com/docker/docker/api/types/container"
	"github.com/docker/docker/client"
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	dockerClient "github.com/portainer/portainer/api/docker/client"
	"github.com/portainer/portainer/api/internal/endpointutils"
	"github.com/portainer/portainer/api/internal/registryutils"
	"github.com/portainer/portainer/api/kubernetes/cli"
	"github.com/portainer/portainer/api/logs"
	"github.com/portainer/portainer/api/pendingactions/actions"
	"github.com/portainer/portainer/pkg/endpoints"

	"github.com/rs/zerolog/log"
)

type PostInitMigrator struct {
	kubeFactory        *cli.ClientFactory
	dockerFactory      *dockerClient.ClientFactory
	dataStore          dataservices.DataStore
	assetsPath         string
	kubernetesDeployer portainer.KubernetesDeployer
}

func NewPostInitMigrator(
	kubeFactory *cli.ClientFactory,
	dockerFactory *dockerClient.ClientFactory,
	dataStore dataservices.DataStore,
	assetsPath string,
	kubernetesDeployer portainer.KubernetesDeployer,
) *PostInitMigrator {
	return &PostInitMigrator{
		kubeFactory:        kubeFactory,
		dockerFactory:      dockerFactory,
		dataStore:          dataStore,
		assetsPath:         assetsPath,
		kubernetesDeployer: kubernetesDeployer,
	}
}

// PostInitMigrate will run all post-init migrations, which require docker/kube clients for all edge or non-edge environments
func (postInitMigrator *PostInitMigrator) PostInitMigrate() error {
	var environments []portainer.Endpoint

	if err := postInitMigrator.dataStore.UpdateTx(func(tx dataservices.DataStoreTx) error {
		var err error
		if environments, err = tx.Endpoint().ReadAll(func(endpoint portainer.Endpoint) bool {
			return endpoints.HasDirectConnectivity(&endpoint)
		}); err != nil {
			return fmt.Errorf("failed to retrieve environments: %w", err)
		}

		var pendingActions []portainer.PendingAction
		if pendingActions, err = tx.PendingActions().ReadAll(func(action portainer.PendingAction) bool {
			return action.Action == actions.PostInitMigrateEnvironment
		}); err != nil {
			return fmt.Errorf("failed to retrieve pending actions: %w", err)
		}

		// Sort for the binary search in createPostInitMigrationPendingAction()
		slices.SortFunc(pendingActions, func(a, b portainer.PendingAction) int {
			return cmp.Compare(a.EndpointID, b.EndpointID)
		})

		for _, environment := range environments {
			if !endpoints.IsEdgeEndpoint(&environment) {
				continue
			}

			// Edge environments will run after the server starts, in pending actions
			log.Info().
				Int("endpoint_id", int(environment.ID)).
				Msg("adding pending action 'PostInitMigrateEnvironment' for environment")

			if err := postInitMigrator.createPostInitMigrationPendingAction(tx, environment.ID, pendingActions); err != nil {
				log.Error().
					Err(err).
					Int("endpoint_id", int(environment.ID)).
					Msg("error creating pending action for environment")
			}
		}

		return err
	}); err != nil {
		log.Error().Err(err).Msg("error running post-init migrations")

		return err
	}

	for _, environment := range environments {
		if endpoints.IsEdgeEndpoint(&environment) {
			continue
		}

		// Non-edge environments will run before the server starts.
		if err := postInitMigrator.MigrateEnvironment(&environment); err != nil {
			log.Error().
				Err(err).
				Int("endpoint_id", int(environment.ID)).
				Msg("error running post-init migrations for non-edge environment")
		}
	}

	return nil
}

// try to create a post init migration pending action. If it already exists, do nothing
// this function exists for readability, not reusability
// pending actions must be passed in ascending order by endpoint ID
func (postInitMigrator *PostInitMigrator) createPostInitMigrationPendingAction(tx dataservices.DataStoreTx, environmentID portainer.EndpointID, pendingActions []portainer.PendingAction) error {
	action := portainer.PendingAction{
		EndpointID: environmentID,
		Action:     actions.PostInitMigrateEnvironment,
	}

	if _, found := slices.BinarySearchFunc(pendingActions, environmentID, func(e portainer.PendingAction, id portainer.EndpointID) int {
		return cmp.Compare(e.EndpointID, id)
	}); found {
		log.Debug().
			Str("action", action.Action).
			Int("endpoint_id", int(action.EndpointID)).
			Msg("pending action already exists for environment, skipping...")

		return nil
	}

	return tx.PendingActions().Create(&action)
}

// MigrateEnvironment runs migrations on a single environment
func (migrator *PostInitMigrator) MigrateEnvironment(environment *portainer.Endpoint) error {
	log.Info().
		Int("endpoint_id", int(environment.ID)).
		Msg("executing post init migration for environment")

	switch {
	case endpointutils.IsKubernetesEndpoint(environment):
		// get the kubeclient for the environment, and skip all kube migrations if there's an error
		kubeclient, err := migrator.kubeFactory.GetPrivilegedKubeClient(environment)
		if err != nil {
			log.Error().
				Err(err).
				Int("endpoint_id", int(environment.ID)).
				Msg("error creating kubeclient for environment")

			return err
		}

		// If one environment fails, it is logged and the next migration runs. The error is returned at the end and handled by pending actions
		var latestErr error
		kubernetesMigrations := []func() error{
			func() error { return migrator.MigrateIngresses(*environment, kubeclient) },
			func() error { return migrator.MigrateRegistrySASecrets(*environment, kubeclient) },
		}

		for _, migration := range kubernetesMigrations {
			if err := migration(); err != nil {
				latestErr = err
			}
		}

		return latestErr
	case endpointutils.IsDockerEndpoint(environment):
		// get the docker client for the environment, and skip all docker migrations if there's an error
		dockerClient, err := migrator.dockerFactory.CreateClient(environment, "", nil)
		if err != nil {
			log.Error().
				Err(err).
				Int("endpoint_id", int(environment.ID)).
				Msg("error creating docker client for environment")

			return err
		}
		defer logs.CloseAndLogErr(dockerClient)

		if err := migrator.MigrateGPUs(*environment, dockerClient); err != nil {
			log.Error().
				Err(err).
				Int("endpoint_id", int(environment.ID)).
				Msg("error migrating GPUs for environment")

			return err
		}
	}

	return nil
}

func (migrator *PostInitMigrator) MigrateRegistrySASecrets(environment portainer.Endpoint, kubeclient *cli.KubeClient) error {
	if !environment.PostInitMigrations.MigrateRegistrySASecrets {
		return nil
	}

	log.Debug().
		Int("endpoint_id", int(environment.ID)).
		Msg("migrating registry SA secrets for environment")

	return migrator.dataStore.UpdateTx(func(tx dataservices.DataStoreTx) error {
		env, err := tx.Endpoint().Endpoint(environment.ID)
		if err != nil {
			return err
		}

		if !env.PostInitMigrations.MigrateRegistrySASecrets {
			return nil
		}

		registries, err := tx.Registry().ReadAll()
		if err != nil {
			return err
		}

		for _, registry := range registries {
			access, ok := registry.RegistryAccesses[env.ID]
			if !ok || len(access.Namespaces) == 0 {
				continue
			}

			secretName := registryutils.RegistrySecretName(registry.ID)
			for _, namespace := range access.Namespaces {
				if err := kubeclient.AddImagePullSecretToServiceAccount(namespace, "default", secretName); err != nil {
					log.Warn().
						Err(err).
						Int("endpoint_id", int(env.ID)).
						Str("namespace", namespace).
						Str("secret", secretName).
						Msg("failed to add imagePullSecret to service account during registry SA secret migration")
				}
			}
		}

		env.PostInitMigrations.MigrateRegistrySASecrets = false
		return tx.Endpoint().UpdateEndpoint(env.ID, env)
	})
}

func (migrator *PostInitMigrator) MigrateIngresses(environment portainer.Endpoint, kubeclient *cli.KubeClient) error {
	// Early exit if we do not need to migrate!
	if !environment.PostInitMigrations.MigrateIngresses {
		return nil
	}

	log.Debug().
		Int("endpoint_id", int(environment.ID)).
		Msg("migrating ingresses for environment")

	if err := migrator.kubeFactory.MigrateEndpointIngresses(&environment, migrator.dataStore, kubeclient); err != nil {
		log.Error().
			Err(err).
			Int("endpoint_id", int(environment.ID)).
			Msg("error migrating ingresses for environment")

		return err
	}

	return nil
}

// MigrateGPUs will check all docker endpoints for containers with GPUs and set EnableGPUManagement to true if any are found
// If there's an error getting the containers, we'll log it and move on
func (migrator *PostInitMigrator) MigrateGPUs(e portainer.Endpoint, dockerClient *client.Client) error {
	return migrator.dataStore.UpdateTx(func(tx dataservices.DataStoreTx) error {
		environment, err := tx.Endpoint().Endpoint(e.ID)
		if err != nil {
			log.Error().
				Err(err).
				Int("endpoint_id", int(e.ID)).
				Msg("error getting environment")

			return err
		}

		// Early exit if we do not need to migrate!
		if !environment.PostInitMigrations.MigrateGPUs {
			return nil
		}

		log.Debug().
			Int("endpoint_id", int(e.ID)).
			Msg("migrating GPUs for environment")

		// Get all containers
		containers, err := dockerClient.ContainerList(context.Background(), container.ListOptions{All: true})
		if err != nil {
			log.Error().
				Err(err).
				Int("endpoint_id", int(environment.ID)).
				Msg("failed to list containers for environment")

			return err
		}

		// Check for a gpu on each container. If even one GPU is found, set EnableGPUManagement to true for the whole environment
	containersLoop:
		for _, container := range containers {
			// https://www.sobyte.net/post/2022-10/go-docker/ has nice documentation on the docker client with GPUs
			containerDetails, err := dockerClient.ContainerInspect(context.Background(), container.ID)
			if err != nil {
				log.Error().Err(err).Msg("failed to inspect container")

				continue
			}

			deviceRequests := containerDetails.HostConfig.DeviceRequests
			for _, deviceRequest := range deviceRequests {
				if deviceRequest.Driver == "nvidia" {
					environment.EnableGPUManagement = true

					break containersLoop
				}
			}
		}

		// Set the MigrateGPUs flag to false so we don't run this again
		environment.PostInitMigrations.MigrateGPUs = false
		if err := tx.Endpoint().UpdateEndpoint(environment.ID, environment); err != nil {
			log.Error().
				Err(err).
				Int("endpoint_id", int(environment.ID)).
				Msg("error updating EnableGPUManagement flag for environment")

			return err
		}

		return nil
	})
}
