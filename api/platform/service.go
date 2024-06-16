package platform

import (
	"errors"
	"fmt"
	"slices"
	"strings"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	"github.com/portainer/portainer/api/internal/endpointutils"
	"github.com/rs/zerolog/log"
)

type Service interface {
	GetLocalEnvironment() *portainer.Endpoint
	GetPlatform() ContainerPlatform
}

func NewService(dataStore dataservices.DataStore) (Service, error) {
	environment, platform, err := guessLocalEnvironment(dataStore)
	if err != nil {
		return nil, fmt.Errorf("failed to guess local environment: %w", err)
	}

	return &service{
		environment: environment,
		platform:    platform,
	}, nil
}

type service struct {
	environment *portainer.Endpoint
	platform    ContainerPlatform
}

func (service *service) GetLocalEnvironment() *portainer.Endpoint {
	return service.environment
}

func (service *service) GetPlatform() ContainerPlatform {
	return service.platform
}

var platformToEndpointType = map[ContainerPlatform][]portainer.EndpointType{
	PlatformDocker:     {portainer.AgentOnDockerEnvironment, portainer.DockerEnvironment},
	PlatformKubernetes: {portainer.KubernetesLocalEnvironment},
}

func guessLocalEnvironment(dataStore dataservices.DataStore) (*portainer.Endpoint, ContainerPlatform, error) {
	platform := DetermineContainerPlatform()

	if !slices.Contains([]ContainerPlatform{PlatformDocker, PlatformKubernetes}, platform) {
		log.Debug().
			Str("platform", string(platform)).
			Msg("environment not supported for upgrade")

		return nil, "", nil
	}

	endpoints, err := dataStore.Endpoint().Endpoints()
	if err != nil {
		return nil, "", fmt.Errorf("failed to retrieve endpoints: %w", err)
	}

	endpointTypes, ok := platformToEndpointType[platform]
	if !ok {
		return nil, "", errors.New("failed to determine endpoint type")
	}

	for _, endpoint := range endpoints {
		if slices.Contains(endpointTypes, endpoint.Type) {
			if platform != PlatformDocker {
				return &endpoint, platform, nil
			}

			dockerPlatform := checkDockerEnvTypeForUpgrade(&endpoint)
			if dockerPlatform != "" {
				return &endpoint, dockerPlatform, nil
			}
		}
	}

	return nil, "", errors.New("failed to find local endpoint")
}

func checkDockerEnvTypeForUpgrade(environment *portainer.Endpoint) ContainerPlatform {
	if endpointutils.IsLocalEndpoint(environment) { // standalone
		return PlatformDockerStandalone
	}

	if strings.HasPrefix(environment.URL, "tcp://tasks.") { // swarm
		return PlatformDockerSwarm
	}

	return ""
}
