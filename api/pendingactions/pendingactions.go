package pendingactions

import (
	"context"
	"fmt"
	"sync"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	"github.com/portainer/portainer/api/internal/authorization"
	kubecli "github.com/portainer/portainer/api/kubernetes/cli"
	"github.com/rs/zerolog/log"
)

type (
	PendingActionsService struct {
		authorizationService *authorization.Service
		clientFactory        *kubecli.ClientFactory
		dataStore            dataservices.DataStore
		shutdownCtx          context.Context

		mu sync.Mutex
	}
)

func NewService(
	dataStore dataservices.DataStore,
	clientFactory *kubecli.ClientFactory,
	authorizationService *authorization.Service,
	shutdownCtx context.Context,
) *PendingActionsService {
	return &PendingActionsService{
		dataStore:            dataStore,
		shutdownCtx:          shutdownCtx,
		authorizationService: authorizationService,
		clientFactory:        clientFactory,
		mu:                   sync.Mutex{},
	}
}

func (service *PendingActionsService) Create(r portainer.PendingActions) error {
	return service.dataStore.PendingActions().Create(&r)
}

func (service *PendingActionsService) Execute(id portainer.EndpointID) error {

	service.mu.Lock()
	defer service.mu.Unlock()

	endpoint, err := service.dataStore.Endpoint().Endpoint(id)
	if err != nil {
		return fmt.Errorf("failed to retrieve endpoint %d: %w", id, err)
	}

	if endpoint.Status != portainer.EndpointStatusUp {
		log.Debug().Msgf("Endpoint %d is not up", id)
		return fmt.Errorf("endpoint %d is not up: %w", id, err)
	}

	pendingActions, err := service.dataStore.PendingActions().ReadAll()
	if err != nil {
		log.Error().Err(err).Msgf("failed to retrieve pending actions")
		return fmt.Errorf("failed to retrieve pending actions for endpoint %d: %w", id, err)
	}

	for _, endpointPendingAction := range pendingActions {
		if endpointPendingAction.EndpointID == id {
			err := service.executePendingAction(endpointPendingAction, endpoint)
			if err != nil {
				log.Error().Err(err).Msgf("failed to execute pending action")
				return fmt.Errorf("failed to execute pending action: %w", err)
			} else {
				// delete the pending action
				err := service.dataStore.PendingActions().Delete(endpointPendingAction.ID)
				if err != nil {
					log.Error().Err(err).Msgf("failed to delete pending action")
					return fmt.Errorf("failed to delete pending action: %w", err)
				}
			}
		}
	}

	return nil
}

func (service *PendingActionsService) executePendingAction(pendingAction portainer.PendingActions, endpoint *portainer.Endpoint) error {
	log.Debug().Msgf("Executing pending action %s for endpoint %d", pendingAction.Action, pendingAction.EndpointID)

	defer func() {
		log.Debug().Msgf("End executing pending action %s for endpoint %d", pendingAction.Action, pendingAction.EndpointID)
	}()

	switch pendingAction.Action {
	case "CleanNAPWithOverridePolicies":
		if (pendingAction.ActionData == nil) || (pendingAction.ActionData.(portainer.EndpointGroupID) == 0) {
			service.authorizationService.CleanNAPWithOverridePolicies(service.dataStore, endpoint, nil)
		} else {
			endpointGroupID := pendingAction.ActionData.(portainer.EndpointGroupID)
			endpointGroup, err := service.dataStore.EndpointGroup().Read(portainer.EndpointGroupID(endpointGroupID))
			if err != nil {
				log.Error().Err(err).Msgf("Error reading endpoint group to clean NAP with override policies for endpoint %d and endpoint group %d", endpoint.ID, endpointGroup.ID)
				return fmt.Errorf("failed to retrieve endpoint group %d: %w", endpointGroupID, err)
			}
			err = service.authorizationService.CleanNAPWithOverridePolicies(service.dataStore, endpoint, endpointGroup)
			if err != nil {
				log.Error().Err(err).Msgf("Error cleaning NAP with override policies for endpoint %d and endpoint group %d", endpoint.ID, endpointGroup.ID)
				return fmt.Errorf("failed to clean NAP with override policies for endpoint %d and endpoint group %d: %w", endpoint.ID, endpointGroup.ID, err)
			}
		}
		return nil
	}
	return nil
}
