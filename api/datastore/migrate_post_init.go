package datastore

import (
	"context"

	"github.com/docker/docker/api/types"
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	dockerclient "github.com/portainer/portainer/api/docker/client"
	"github.com/portainer/portainer/api/kubernetes/cli"

	"github.com/rs/zerolog/log"
)

type PostInitMigrator struct {
	kubeFactory   *cli.ClientFactory
	dockerFactory *dockerclient.ClientFactory
	dataStore     dataservices.DataStore
}

func NewPostInitMigrator(kubeFactory *cli.ClientFactory, dockerFactory *dockerclient.ClientFactory, dataStore dataservices.DataStore) *PostInitMigrator {
	return &PostInitMigrator{
		kubeFactory:   kubeFactory,
		dockerFactory: dockerFactory,
		dataStore:     dataStore,
	}
}

func (migrator *PostInitMigrator) PostInitMigrate() error {
	if err := migrator.PostInitMigrateIngresses(); err != nil {
		return err
	}

	migrator.PostInitMigrateGPUs()

	return nil
}

func (migrator *PostInitMigrator) PostInitMigrateIngresses() error {
	endpoints, err := migrator.dataStore.Endpoint().Endpoints()
	if err != nil {
		return err
	}

	for i := range endpoints {
		// Early exit if we do not need to migrate!
		if !endpoints[i].PostInitMigrations.MigrateIngresses {
			return nil
		}

		err := migrator.kubeFactory.MigrateEndpointIngresses(&endpoints[i])
		if err != nil {
			log.Debug().Err(err).Msg("failure migrating endpoint ingresses")
		}
	}

	return nil
}

// PostInitMigrateGPUs will check all docker endpoints for containers with GPUs and set EnableGPUManagement to true if any are found
// If there's an error getting the containers, we'll log it and move on
func (migrator *PostInitMigrator) PostInitMigrateGPUs() {
	environments, err := migrator.dataStore.Endpoint().Endpoints()
	if err != nil {
		log.Err(err).Msg("failure getting endpoints")
		return
	}

	for i := range environments {
		if environments[i].Type == portainer.DockerEnvironment {
			// // Early exit if we do not need to migrate!
			if !environments[i].PostInitMigrations.MigrateGPUs {
				return
			}

			// set the MigrateGPUs flag to false so we don't run this again
			environments[i].PostInitMigrations.MigrateGPUs = false
			migrator.dataStore.Endpoint().UpdateEndpoint(environments[i].ID, &environments[i])

			// create a docker client
			dockerClient, err := migrator.dockerFactory.CreateClient(&environments[i], "", nil)
			if err != nil {
				log.Err(err).Msg("failure creating docker client for environment: " + environments[i].Name)
				return
			}
			defer dockerClient.Close()

			// get all containers
			containers, err := dockerClient.ContainerList(context.Background(), types.ContainerListOptions{All: true})
			if err != nil {
				log.Err(err).Msg("failed to list containers")
				return
			}

			// check for a gpu on each container. If even one GPU is found, set EnableGPUManagement to true for the whole endpoint
		containersLoop:
			for _, container := range containers {
				// https://www.sobyte.net/post/2022-10/go-docker/ has nice documentation on the docker client with GPUs
				containerDetails, err := dockerClient.ContainerInspect(context.Background(), container.ID)
				if err != nil {
					log.Err(err).Msg("failed to inspect container")
					return
				}

				deviceRequests := containerDetails.HostConfig.Resources.DeviceRequests
				for _, deviceRequest := range deviceRequests {
					if deviceRequest.Driver == "nvidia" {
						environments[i].EnableGPUManagement = true
						migrator.dataStore.Endpoint().UpdateEndpoint(environments[i].ID, &environments[i])

						break containersLoop
					}
				}
			}
		}
	}
}
