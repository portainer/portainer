package handlers

import (
	"fmt"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	"github.com/portainer/portainer/api/datastore/postinit"
	dockerClient "github.com/portainer/portainer/api/docker/client"
	"github.com/portainer/portainer/api/internal/authorization"
	kubecli "github.com/portainer/portainer/api/kubernetes/cli"
	"github.com/rs/zerolog/log"
)

type HandlerPostInitMigrateEnvironment struct {
	authorizationService *authorization.Service
	dataStore            dataservices.DataStore
	kubeFactory          *kubecli.ClientFactory
	dockerFactory        *dockerClient.ClientFactory
	assetsPath           string
	kubernetesDeployer   portainer.KubernetesDeployer
}

// NewPostInitMigrateEnvironment creates a new PostInitMigrateEnvironment pending action
func NewHandlerPostInitMigrateEnvironment(
	authorizationService *authorization.Service,
	dataStore dataservices.DataStore,
	kubeFactory *kubecli.ClientFactory,
	dockerFactory *dockerClient.ClientFactory,
	assetsPath string,
	kubernetesDeployer portainer.KubernetesDeployer,
) *HandlerPostInitMigrateEnvironment {
	return &HandlerPostInitMigrateEnvironment{
		authorizationService: authorizationService,
		dataStore:            dataStore,
		kubeFactory:          kubeFactory,
		dockerFactory:        dockerFactory,
		assetsPath:           assetsPath,
		kubernetesDeployer:   kubernetesDeployer,
	}
}

func (h *HandlerPostInitMigrateEnvironment) Execute(_ portainer.PendingAction, endpoint *portainer.Endpoint) error {
	postInitMigrator := postinit.NewPostInitMigrator(
		h.kubeFactory,
		h.dockerFactory,
		h.dataStore,
		h.assetsPath,
		h.kubernetesDeployer,
	)
	err := postInitMigrator.MigrateEnvironment(endpoint)
	if err != nil {
		log.Error().Err(err).Msgf("Error running post-init migrations for edge environment %d", endpoint.ID)
		return fmt.Errorf("failed running post-init migrations for edge environment %d: %w", endpoint.ID, err)
	}

	return nil
}
