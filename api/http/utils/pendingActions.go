package utils

import (
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	"github.com/portainer/portainer/api/internal/authorization"
	"github.com/rs/zerolog/log"
)

func EndpointPendingActions(endpoint *portainer.Endpoint) *portainer.EndpointPendingActions {
	return endpoint.PendingActions
}

func GetUpdatedEndpointPendingActions(endpoint *portainer.Endpoint, action string, value interface{}) *portainer.EndpointPendingActions {
	if endpoint.PendingActions == nil {
		endpoint.PendingActions = &portainer.EndpointPendingActions{}
	}

	switch action {
	case "CleanNAPWithOverridePolicies":
		endpoint.PendingActions.CleanNAPWithOverridePolicies.EndpointGroups = append(endpoint.PendingActions.CleanNAPWithOverridePolicies.EndpointGroups, value.(portainer.EndpointGroupID))
	}

	return endpoint.PendingActions
}

func RunPendingActions(endpoint *portainer.Endpoint, dataStore dataservices.DataStoreTx, authorizationService *authorization.Service) error {

	if endpoint.PendingActions == nil {
		return nil
	}

	log.Info().Msgf("Running pending actions for endpoint %d", endpoint.ID)

	if endpoint.PendingActions.CleanNAPWithOverridePolicies.EndpointGroups != nil {
		log.Info().Int("endpoint_id", int(endpoint.ID)).Msgf("Cleaning NAP with override policies for endpoint groups %v", endpoint.PendingActions.CleanNAPWithOverridePolicies.EndpointGroups)
		failedEndpointGroupIDs := make([]portainer.EndpointGroupID, 0)
		for _, endpointGroupID := range endpoint.PendingActions.CleanNAPWithOverridePolicies.EndpointGroups {
			endpointGroup, err := dataStore.EndpointGroup().Read(portainer.EndpointGroupID(endpointGroupID))
			if err != nil {
				log.Error().Err(err).Msgf("Error reading endpoint group to clean NAP with override policies for endpoint %d and endpoint group %d", endpoint.ID, endpointGroup.ID)
				failedEndpointGroupIDs = append(failedEndpointGroupIDs, endpointGroupID)
				continue
			}
			err = authorizationService.CleanNAPWithOverridePolicies(dataStore, endpoint, endpointGroup)
			if err != nil {
				failedEndpointGroupIDs = append(failedEndpointGroupIDs, endpointGroupID)
				log.Error().Err(err).Msgf("Error cleaning NAP with override policies for endpoint %d and endpoint group %d", endpoint.ID, endpointGroup.ID)
			}
		}

		endpoint.PendingActions.CleanNAPWithOverridePolicies.EndpointGroups = failedEndpointGroupIDs
		err := dataStore.Endpoint().UpdateEndpoint(endpoint.ID, endpoint)
		if err != nil {
			log.Error().Err(err).Msgf("While running pending actions, error updating endpoint %d", endpoint.ID)
			return err
		}
	}

	return nil
}
