package postinit

import (
	"context"

	"github.com/docker/docker/api/types/container"
	"github.com/docker/docker/client"
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	dockerClient "github.com/portainer/portainer/api/docker/client"
	"github.com/portainer/portainer/api/internal/endpointutils"
	"github.com/portainer/portainer/api/kubernetes/cli"
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
	environments, err := postInitMigrator.dataStore.Endpoint().Endpoints()
	if err != nil {
		log.Error().Err(err).Msg("Error getting environments")
		return err
	}

	for _, environment := range environments {
		// edge environments will run after the server starts, in pending actions
		if endpoints.IsEdgeEndpoint(&environment) {
			// Skip edge environments that do not have direct connectivity
			if !endpoints.HasDirectConnectivity(&environment) {
				continue
			}

			log.Info().
				Int("endpoint_id", int(environment.ID)).
				Msg("adding pending action 'PostInitMigrateEnvironment' for environment")

			if err := postInitMigrator.createPostInitMigrationPendingAction(environment.ID); err != nil {
				log.Error().
					Err(err).
					Int("endpoint_id", int(environment.ID)).
					Msg("error creating pending action for environment")
			}
		} else {
			// Non-edge environments will run before the server starts.
			if err := postInitMigrator.MigrateEnvironment(&environment); err != nil {
				log.Error().
					Err(err).
					Int("endpoint_id", int(environment.ID)).
					Msg("error running post-init migrations for non-edge environment")
			}
		}

	}

	return nil
}

// try to create a post init migration pending action. If it already exists, do nothing
// this function exists for readability, not reusability
// TODO: This should be moved into pending actions as part of the pending action migration
func (postInitMigrator *PostInitMigrator) createPostInitMigrationPendingAction(environmentID portainer.EndpointID) error {
	// If there are no pending actions for the given endpoint, create one
	err := postInitMigrator.dataStore.PendingActions().Create(&portainer.PendingAction{
		EndpointID: environmentID,
		Action:     actions.PostInitMigrateEnvironment,
	})
	if err != nil {
		log.Error().Err(err).Msgf("Error creating pending action for environment %d", environmentID)
	}
	return nil
}

// MigrateEnvironment runs migrations on a single environment
func (migrator *PostInitMigrator) MigrateEnvironment(environment *portainer.Endpoint) error {
	log.Info().Msgf("Executing post init migration for environment %d", environment.ID)

	switch {
	case endpointutils.IsKubernetesEndpoint(environment):
		// get the kubeclient for the environment, and skip all kube migrations if there's an error
		kubeclient, err := migrator.kubeFactory.GetPrivilegedKubeClient(environment)
		if err != nil {
			log.Error().Err(err).Msgf("Error creating kubeclient for environment: %d", environment.ID)
			return err
		}
		// if one environment fails, it is logged and the next migration runs. The error is returned at the end and handled by pending actions
		err = migrator.MigrateIngresses(*environment, kubeclient)
		if err != nil {
			return err
		}
		return nil
	case endpointutils.IsDockerEndpoint(environment):
		// get the docker client for the environment, and skip all docker migrations if there's an error
		dockerClient, err := migrator.dockerFactory.CreateClient(environment, "", nil)
		if err != nil {
			log.Error().Err(err).Msgf("Error creating docker client for environment: %d", environment.ID)
			return err
		}
		defer dockerClient.Close()
		migrator.MigrateGPUs(*environment, dockerClient)
	}

	return nil
}

func (migrator *PostInitMigrator) MigrateIngresses(environment portainer.Endpoint, kubeclient *cli.KubeClient) error {
	// Early exit if we do not need to migrate!
	if !environment.PostInitMigrations.MigrateIngresses {
		return nil
	}
	log.Debug().Msgf("Migrating ingresses for environment %d", environment.ID)

	err := migrator.kubeFactory.MigrateEndpointIngresses(&environment, migrator.dataStore, kubeclient)
	if err != nil {
		log.Error().Err(err).Msgf("Error migrating ingresses for environment %d", environment.ID)
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
			log.Error().Err(err).Msgf("Error getting environment %d", environment.ID)
			return err
		}
		// Early exit if we do not need to migrate!
		if !environment.PostInitMigrations.MigrateGPUs {
			return nil
		}
		log.Debug().Msgf("Migrating GPUs for environment %d", e.ID)

		// get all containers
		containers, err := dockerClient.ContainerList(context.Background(), container.ListOptions{All: true})
		if err != nil {
			log.Error().Err(err).Msgf("failed to list containers for environment %d", environment.ID)
			return err
		}

		// check for a gpu on each container. If even one GPU is found, set EnableGPUManagement to true for the whole environment
	containersLoop:
		for _, container := range containers {
			// https://www.sobyte.net/post/2022-10/go-docker/ has nice documentation on the docker client with GPUs
			containerDetails, err := dockerClient.ContainerInspect(context.Background(), container.ID)
			if err != nil {
				log.Error().Err(err).Msg("failed to inspect container")
				continue
			}

			deviceRequests := containerDetails.HostConfig.Resources.DeviceRequests
			for _, deviceRequest := range deviceRequests {
				if deviceRequest.Driver == "nvidia" {
					environment.EnableGPUManagement = true
					break containersLoop
				}
			}
		}

		// set the MigrateGPUs flag to false so we don't run this again
		environment.PostInitMigrations.MigrateGPUs = false
		err = tx.Endpoint().UpdateEndpoint(environment.ID, environment)
		if err != nil {
			log.Error().Err(err).Msgf("Error updating EnableGPUManagement flag for environment %d", environment.ID)
			return err
		}

		return nil
	})
}
