package pendingactions

import (
	"fmt"
	"sync"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	"github.com/portainer/portainer/api/internal/endpointutils"
	kubecli "github.com/portainer/portainer/api/kubernetes/cli"
	"github.com/rs/zerolog/log"
)

type PendingActionsService struct {
	kubeFactory *kubecli.ClientFactory
	dataStore   dataservices.DataStore
	mu          sync.Mutex
}

var handlers = make(map[string]portainer.PendingActionHandler)

func NewService(
	dataStore dataservices.DataStore,
	kubeFactory *kubecli.ClientFactory,
) *PendingActionsService {
	return &PendingActionsService{
		dataStore:   dataStore,
		kubeFactory: kubeFactory,
		mu:          sync.Mutex{},
	}
}

func (service *PendingActionsService) RegisterHandler(name string, handler portainer.PendingActionHandler) {
	handlers[name] = handler
}

func (service *PendingActionsService) Create(r portainer.PendingAction) error {
	return service.dataStore.PendingActions().Create(&r)
}

func (service *PendingActionsService) Execute(id portainer.EndpointID) error {
	service.mu.Lock()
	defer service.mu.Unlock()

	endpoint, err := service.dataStore.Endpoint().Endpoint(id)
	if err != nil {
		return fmt.Errorf("failed to retrieve environment %d: %w", id, err)
	}

	isKubernetesEndpoint := endpointutils.IsKubernetesEndpoint(endpoint) && !endpointutils.IsEdgeEndpoint(endpoint)

	// EndpointStatusUp is only relevant for non-Kubernetes endpoints
	// Sometimes the endpoint is UP but the status is not updated in the database
	if !isKubernetesEndpoint && endpoint.Status != portainer.EndpointStatusUp {
		log.Debug().Msgf("Environment %q (id: %d) is not up", endpoint.Name, id)
		return fmt.Errorf("environment %q (id: %d) is not up", endpoint.Name, id)
	}

	// For Kubernetes endpoints, we need to check if the endpoint is up by creating a kube client
	if isKubernetesEndpoint {
		_, err := service.kubeFactory.GetKubeClient(endpoint)
		if err != nil {
			log.Debug().Err(err).Msgf("Environment %q (id: %d) is not up", endpoint.Name, id)
			return fmt.Errorf("environment %q (id: %d) is not up", endpoint.Name, id)
		}
	}

	pendingActions, err := service.dataStore.PendingActions().ReadAll()
	if err != nil {
		log.Error().Err(err).Msgf("failed to retrieve pending actions")
		return fmt.Errorf("failed to retrieve pending actions for environment %d: %w", id, err)
	}

	for _, endpointPendingAction := range pendingActions {
		if endpointPendingAction.EndpointID == id {
			err := service.executePendingAction(endpointPendingAction, endpoint)
			if err != nil {
				log.Warn().Err(err).Msgf("failed to execute pending action")
				return fmt.Errorf("failed to execute pending action: %w", err)
			}

			err = service.dataStore.PendingActions().Delete(endpointPendingAction.ID)
			if err != nil {
				log.Error().Err(err).Msgf("failed to delete pending action")
				return fmt.Errorf("failed to delete pending action: %w", err)
			}
		}
	}

	return nil
}

func (service *PendingActionsService) executePendingAction(pendingAction portainer.PendingAction, endpoint *portainer.Endpoint) error {
	log.Debug().Msgf("Executing pending action %s for environment %d", pendingAction.Action, pendingAction.EndpointID)

	defer func() {
		log.Debug().Msgf("End executing pending action %s for environment %d", pendingAction.Action, pendingAction.EndpointID)
	}()

	handler, ok := handlers[pendingAction.Action]
	if !ok {
		log.Warn().Msgf("No handler found for pending action %s", pendingAction.Action)
		return nil
	}

	return handler.Execute(pendingAction, endpoint)
}
