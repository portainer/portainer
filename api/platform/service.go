package platform

import (
	"errors"
	"fmt"
	"slices"
	"strings"
	"sync"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	"github.com/portainer/portainer/api/internal/endpointutils"

	"github.com/rs/zerolog/log"
)

var (
	ErrNoLocalEnvironment = errors.New("No local environment was detected")
)

type Service interface {
	GetLocalEnvironment() (*portainer.Endpoint, error)
	GetPlatform() (ContainerPlatform, error)
}

type service struct {
	dataStore   dataservices.DataStore
	environment *portainer.Endpoint
	platform    ContainerPlatform
	mu          sync.Mutex
}

func NewService(dataStore dataservices.DataStore) (*service, error) {
	return &service{dataStore: dataStore}, nil
}

func (service *service) loadEnvAndPlatform() error {
	if service.environment != nil {
		return nil
	}

	environment, platform, err := detectLocalEnvironment(service.dataStore)
	if err != nil {
		return err
	}

	service.environment = environment
	service.platform = platform

	return nil
}

func (service *service) GetLocalEnvironment() (*portainer.Endpoint, error) {
	service.mu.Lock()
	defer service.mu.Unlock()

	if err := service.loadEnvAndPlatform(); err != nil {
		return nil, err
	}

	return service.environment, nil
}

func (service *service) GetPlatform() (ContainerPlatform, error) {
	service.mu.Lock()
	defer service.mu.Unlock()

	if err := service.loadEnvAndPlatform(); err != nil {
		return "", err
	}

	return service.platform, nil
}

var platformToEndpointType = map[ContainerPlatform][]portainer.EndpointType{
	PlatformDocker:     {portainer.AgentOnDockerEnvironment, portainer.DockerEnvironment},
	PlatformKubernetes: {portainer.KubernetesLocalEnvironment},
}

func detectLocalEnvironment(dataStore dataservices.DataStore) (*portainer.Endpoint, ContainerPlatform, error) {
	platform := DetermineContainerPlatform()

	if !slices.Contains([]ContainerPlatform{PlatformDocker, PlatformKubernetes}, platform) {
		log.Debug().
			Str("platform", string(platform)).
			Msg("environment not supported for upgrade")

		return nil, "", nil
	}

	endpoints, err := dataStore.Endpoint().Endpoints()
	if err != nil {
		return nil, "", fmt.Errorf("failed to retrieve environments: %w", err)
	}

	// skip guessing when there is no endpoints registered in DB
	if len(endpoints) == 0 {
		return nil, "", nil
	}

	endpointTypes, ok := platformToEndpointType[platform]
	if !ok {
		return nil, "", errors.New("failed to determine environment type")
	}

	for _, endpoint := range endpoints {
		if !slices.Contains(endpointTypes, endpoint.Type) {
			continue
		}

		if platform != PlatformDocker {
			return &endpoint, platform, nil
		}

		if dockerPlatform := checkDockerEnvTypeForUpgrade(&endpoint); dockerPlatform != "" {
			return &endpoint, dockerPlatform, nil
		}
	}

	return nil, "", ErrNoLocalEnvironment
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
