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
			log.Debug().Msgf("pending action %s already exists for environment %d, skipping...", action.Action, action.EndpointID)
			return nil
		}
	}

	return service.dataStore.PendingActions().Create(&action)
}

func (service *PendingActionsService) Execute(id portainer.EndpointID) {
	// Run in a goroutine to avoid blocking the main thread due to db tx	=
	go service.execute(id)
}

func (service *PendingActionsService) execute(environmentID portainer.EndpointID) {
	service.mu.Lock()
	defer service.mu.Unlock()

	endpoint, err := service.dataStore.Endpoint().Endpoint(environmentID)
	if err != nil {
		log.Debug().Msgf("failed to retrieve environment %d: %v", environmentID, err)
		return
	}

	isKubernetesEndpoint := endpointutils.IsKubernetesEndpoint(endpoint) && !endpointutils.IsEdgeEndpoint(endpoint)

	// EndpointStatusUp is only relevant for non-Kubernetes endpoints
	// Sometimes the endpoint is UP but the status is not updated in the database
	if !isKubernetesEndpoint {
		if endpoint.Status != portainer.EndpointStatusUp {
			return
		}
	} else {
		// For Kubernetes endpoints, we need to check if the endpoint is up by
		// creating a kube client and performing a simple operation
		client, err := service.kubeFactory.GetPrivilegedKubeClient(endpoint)
		if err != nil {
			log.Debug().Msgf("failed to create Kubernetes client for environment %d: %v", environmentID, err)
			return
		}

		if _, err = client.ServerVersion(); err != nil {
			log.Debug().Err(err).Msgf("Environment %q (id: %d) is not up", endpoint.Name, environmentID)
			return
		}
	}

	pendingActions, err := service.dataStore.PendingActions().ReadAll()
	if err != nil {
		log.Warn().Msgf("failed to read pending actions: %v", err)
		return
	}

	if len(pendingActions) > 0 {
		log.Debug().Msgf("Found %d pending actions", len(pendingActions))
	}

	for i, pendingAction := range pendingActions {
		if pendingAction.EndpointID == environmentID {
			if i == 0 {
				// We have at least 1 pending action for this environment
				log.Debug().Msgf("Executing pending actions for environment %d", environmentID)
			}

			log.Debug().Msgf("executing pending action id=%d, action=%s", pendingAction.ID, pendingAction.Action)
			err := service.executePendingAction(pendingAction, endpoint)
			if err != nil {
				log.Warn().Msgf("failed to execute pending action: %v", err)
				continue
			}

			err = service.dataStore.PendingActions().Delete(pendingAction.ID)
			if err != nil {
				log.Warn().Msgf("failed to delete pending action: %v", err)
				continue
			}

			log.Debug().Msgf("pending action %d finished", pendingAction.ID)
		}
	}
}

func (service *PendingActionsService) executePendingAction(pendingAction portainer.PendingAction, endpoint *portainer.Endpoint) error {
	defer func() {
		if r := recover(); r != nil {
			log.Error().Msgf("recovered from panic while executing pending action %s for environment %d: %v", pendingAction.Action, pendingAction.EndpointID, r)
		}
	}()

	handler, ok := handlers[pendingAction.Action]
	if !ok {
		log.Warn().Msgf("no handler found for pending action %s", pendingAction.Action)
		return nil
	}

	return handler.Execute(pendingAction, endpoint)
}
