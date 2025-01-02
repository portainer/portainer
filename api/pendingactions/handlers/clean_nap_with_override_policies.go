package handlers

import (
	"fmt"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	"github.com/portainer/portainer/api/internal/authorization"
	"github.com/portainer/portainer/api/pendingactions/actions"
	"github.com/rs/zerolog/log"
)

type (
	cleanNAPWithOverridePolicies struct {
		EndpointGroupID portainer.EndpointGroupID
	}

	HandlerCleanNAPWithOverridePolicies struct {
		authorizationService *authorization.Service
		dataStore            dataservices.DataStore
	}
)

// NewCleanNAPWithOverridePolicies creates a new CleanNAPWithOverridePolicies pending action
func NewCleanNAPWithOverridePolicies(endpointID portainer.EndpointID, gid *portainer.EndpointGroupID) portainer.PendingAction {
	pendingAction := portainer.PendingAction{
		EndpointID: endpointID,
		Action:     actions.CleanNAPWithOverridePolicies,
	}

	if gid != nil {
		pendingAction.ActionData = cleanNAPWithOverridePolicies{
			EndpointGroupID: *gid,
		}
	}

	return pendingAction
}

// NewHandlerCleanNAPWithOverridePolicies creates a new handler to execute CleanNAPWithOverridePolicies pending action
func NewHandlerCleanNAPWithOverridePolicies(
	authorizationService *authorization.Service,
	dataStore dataservices.DataStore,
) *HandlerCleanNAPWithOverridePolicies {
	return &HandlerCleanNAPWithOverridePolicies{
		authorizationService: authorizationService,
		dataStore:            dataStore,
	}
}

func (h *HandlerCleanNAPWithOverridePolicies) Execute(pendingAction portainer.PendingAction, endpoint *portainer.Endpoint) error {
	if pendingAction.ActionData == nil {
		h.authorizationService.CleanNAPWithOverridePolicies(h.dataStore, endpoint, nil)
		return nil
	}

	var payload cleanNAPWithOverridePolicies
	err := pendingAction.UnmarshallActionData(&payload)
	if err != nil {
		log.Error().Err(err).Msgf("Error unmarshalling endpoint group ID for cleaning NAP with override policies for environment %d", endpoint.ID)
		return fmt.Errorf("failed to unmarshal endpoint group ID for cleaning NAP with override policies for environment %d: %w", endpoint.ID, err)
	}

	if payload.EndpointGroupID == 0 {
		h.authorizationService.CleanNAPWithOverridePolicies(h.dataStore, endpoint, nil)
		return nil
	}

	endpointGroup, err := h.dataStore.EndpointGroup().Read(payload.EndpointGroupID)
	if err != nil {
		log.Error().Err(err).Msgf("Error reading environment group to clean NAP with override policies for environment %d and environment group %d", endpoint.ID, endpointGroup.ID)
		return fmt.Errorf("failed to retrieve environment group %d: %w", payload.EndpointGroupID, err)
	}

	err = h.authorizationService.CleanNAPWithOverridePolicies(h.dataStore, endpoint, endpointGroup)
	if err != nil {
		log.Error().Err(err).Msgf("Error cleaning NAP with override policies for environment %d and environment group %d", endpoint.ID, endpointGroup.ID)
		return fmt.Errorf("failed to clean NAP with override policies for environment %d and environment group %d: %w", endpoint.ID, endpointGroup.ID, err)
	}

	return nil
}
