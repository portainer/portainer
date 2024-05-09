package pendingactions

import (
	"fmt"
	"reflect"
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

func (service *PendingActionsService) Create(action portainer.PendingAction) error {
	// Check if this pendingAction already exists
	pendingActions, err := service.dataStore.PendingActions().ReadAll()
	if err != nil {
		return fmt.Errorf("failed to retrieve pending actions: %w", err)
	}

	for _, dba := range pendingActions {
		// Same endpoint, same action and data, don't create a repeat
		if dba.EndpointID == action.EndpointID && dba.Action == action.Action &&
			reflect.DeepEqual(dba.ActionData, action.ActionData) {
			log.Debug().Msgf("pending action %s already exists for environment %d", action.Action, action.EndpointID)
			return nil
		}
	}

	return service.dataStore.PendingActions().Create(&action)
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

	log.Debug().Msgf("Executing pending actions for environment %d", id)
	for _, pendingAction := range pendingActions {
		if pendingAction.EndpointID == id {
			log.Debug().Msgf("Executing pendingAction id=%d, action=%s", pendingAction.ID, pendingAction.Action)
			err := service.executePendingAction(pendingAction, endpoint)
			if err != nil {
				log.Warn().Err(err).Msgf("failed to execute pending action")
				return fmt.Errorf("failed to execute pending action: %w", err)
			}

			err = service.dataStore.PendingActions().Delete(pendingAction.ID)
			if err != nil {
				log.Error().Err(err).Msgf("failed to delete pending action")
				return fmt.Errorf("failed to delete pending action: %w", err)
			}

			log.Debug().Msgf("Pending action %d finished", pendingAction.ID)
		}
	}

	return nil
}

func (service *PendingActionsService) executePendingAction(pendingAction portainer.PendingAction, endpoint *portainer.Endpoint) error {
	defer func() {
		if r := recover(); r != nil {
			log.Error().Msgf("Recovered from panic while executing pending action %s for environment %d: %v", pendingAction.Action, pendingAction.EndpointID, r)
		}
	}()

	handler, ok := handlers[pendingAction.Action]
	if !ok {
		log.Warn().Msgf("No handler found for pending action %s", pendingAction.Action)
		return nil
	}

	return handler.Execute(pendingAction, endpoint)
}
