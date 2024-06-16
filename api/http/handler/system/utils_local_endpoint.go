package system

import (
	"slices"
	"strings"

	"github.com/pkg/errors"
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/internal/endpointutils"
	plf "github.com/portainer/portainer/api/platform"
)

var platformToEndpointType = map[plf.ContainerPlatform][]portainer.EndpointType{
	plf.PlatformDocker:     {portainer.AgentOnDockerEnvironment, portainer.DockerEnvironment},
	plf.PlatformKubernetes: {portainer.KubernetesLocalEnvironment},
}

func (handler *Handler) getLocalEndpoint() (*portainer.Endpoint, plf.ContainerPlatform, error) {
	if handler.environment == nil {
		environment, platform, err := handler.guessLocalEndpoint()
		if err != nil {
			return nil, "", errors.Wrap(err, "failed to guess local endpoint")
		}

		handler.environment = environment
		handler.platform = platform
	}

	return handler.environment, handler.platform, nil
}

func (handler *Handler) guessLocalEndpoint() (*portainer.Endpoint, plf.ContainerPlatform, error) {
	platform, err := plf.DetermineContainerPlatform()
	if err != nil {
		return nil, "", errors.Wrap(err, "failed to determine container platform")
	}

	endpoints, err := handler.dataStore.Endpoint().Endpoints()
	if err != nil {
		return nil, "", errors.Wrap(err, "failed to retrieve endpoints")
	}

	endpointTypes, ok := platformToEndpointType[platform]
	if !ok {
		return nil, "", errors.New("failed to determine endpoint type")
	}

	for _, endpoint := range endpoints {
		if slices.Contains(endpointTypes, endpoint.Type) {
			if platform != plf.PlatformDocker {
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

func checkDockerEnvTypeForUpgrade(environment *portainer.Endpoint) plf.ContainerPlatform {
	if endpointutils.IsLocalEndpoint(environment) { // standalone
		return plf.PlatformDockerStandalone
	}

	if strings.HasPrefix(environment.URL, "tcp://tasks.") { // swarm
		return plf.PlatformDockerSwarm
	}

	return ""
}
