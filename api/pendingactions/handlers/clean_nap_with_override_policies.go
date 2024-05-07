package handlers

import (
	"fmt"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	"github.com/portainer/portainer/api/internal/authorization"
	"github.com/rs/zerolog/log"
)

type HandlerCleanNAPWithOverridePolicies struct {
	authorizationService *authorization.Service
	dataStore            dataservices.DataStore
}

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

	var endpointGroupID portainer.EndpointGroupID
	err := pendingAction.UnmarshallActionData(&endpointGroupID)
	if err != nil {
		log.Error().Err(err).Msgf("Error unmarshalling endpoint group ID for cleaning NAP with override policies for environment %d", endpoint.ID)
		return fmt.Errorf("failed to unmarshal endpoint group ID for cleaning NAP with override policies for environment %d: %w", endpoint.ID, err)
	}

	if endpointGroupID == 0 {
		h.authorizationService.CleanNAPWithOverridePolicies(h.dataStore, endpoint, nil)
		return nil
	}

	endpointGroup, err := h.dataStore.EndpointGroup().Read(portainer.EndpointGroupID(endpointGroupID))
	if err != nil {
		log.Error().Err(err).Msgf("Error reading environment group to clean NAP with override policies for environment %d and environment group %d", endpoint.ID, endpointGroup.ID)
		return fmt.Errorf("failed to retrieve environment group %d: %w", endpointGroupID, err)
	}

	err = h.authorizationService.CleanNAPWithOverridePolicies(h.dataStore, endpoint, endpointGroup)
	if err != nil {
		log.Error().Err(err).Msgf("Error cleaning NAP with override policies for environment %d and environment group %d", endpoint.ID, endpointGroup.ID)
		return fmt.Errorf("failed to clean NAP with override policies for environment %d and environment group %d: %w", endpoint.ID, endpointGroup.ID, err)
	}

	return nil
}
