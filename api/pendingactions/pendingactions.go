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

func NewService(dataStore dataservices.DataStore, kubeFactory *kubecli.ClientFactory) *PendingActionsService {
	return &PendingActionsService{dataStore: dataStore, kubeFactory: kubeFactory}
}

func (service *PendingActionsService) RegisterHandler(name string, handler portainer.PendingActionHandler) {
	handlers[name] = handler
}

func (service *PendingActionsService) Create(tx dataservices.DataStoreTx, action portainer.PendingAction) error {
	// Check if this pendingAction already exists
	pendingActions, err := tx.PendingActions().ReadAll(func(a portainer.PendingAction) bool {
		return a.EndpointID == action.EndpointID && a.Action == action.Action && reflect.DeepEqual(a.ActionData, action.ActionData)
	})
	if err != nil {
		return fmt.Errorf("failed to retrieve pending actions: %w", err)
	}

	if len(pendingActions) > 0 {
		// Same endpoint, same action and data, don't create a repeat
		log.Debug().
			Str("action", action.Action).
			Int("endpoint_id", int(action.EndpointID)).
			Msg("pending action already exists for environment, skipping...")

		return nil
	}

	return tx.PendingActions().Create(&action)
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
		log.Debug().Err(err).Int("endpoint_id", int(environmentID)).Msg("failed to retrieve environment")

		return
	}

	isKubernetesEndpoint := endpointutils.IsKubernetesEndpoint(endpoint) && !endpointutils.IsEdgeEndpoint(endpoint)

	if !isKubernetesEndpoint {
		// Edge environments check the heartbeat
		// Other environments check the endpoint status
		if endpointutils.IsEdgeEndpoint(endpoint) {
			if !endpoint.Heartbeat {
				return
			}
		} else if endpoint.Status != portainer.EndpointStatusUp {
			return
		}
	} else {
		// For Kubernetes endpoints, we need to check if the endpoint is up by
		// creating a kube client and performing a simple operation
		client, err := service.kubeFactory.GetPrivilegedKubeClient(endpoint)
		if err != nil {
			log.Debug().
				Err(err).
				Int("endpoint_id", int(environmentID)).
				Msg("failed to create Kubernetes client for environment")

			return
		}

		if _, err = client.ServerVersion(); err != nil {
			log.Debug().
				Err(err).
				Str("endpoint_name", endpoint.Name).
				Int("endpoint_id", int(environmentID)).
				Msg("environment is not up")

			return
		}
	}

	pendingActions, err := service.dataStore.PendingActions().ReadAll(func(a portainer.PendingAction) bool {
		return a.EndpointID == environmentID
	})
	if err != nil {
		log.Warn().Err(err).Msg("failed to read pending actions")
		return
	}

	if len(pendingActions) > 0 {
		log.Debug().Int("pending_action_count", len(pendingActions)).Msg("found pending actions")
	}

	for _, pendingAction := range pendingActions {
		log.Debug().
			Int("pending_action_id", int(pendingAction.ID)).
			Str("action", pendingAction.Action).
			Msg("executing pending action")
		if err := service.executePendingAction(pendingAction, endpoint); err != nil {
			log.Warn().Err(err).Msg("failed to execute pending action")

			continue
		}

		if err := service.dataStore.PendingActions().Delete(pendingAction.ID); err != nil {
			log.Warn().Err(err).Msg("failed to delete pending action")

			continue
		}

		log.Debug().Int("pending_action_id", int(pendingAction.ID)).Msg("pending action finished")
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
		log.Warn().Str("action", pendingAction.Action).Msg("no handler found for pending action")

		return nil
	}

	return handler.Execute(pendingAction, endpoint)
}
