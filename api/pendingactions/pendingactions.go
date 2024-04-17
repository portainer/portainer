package pendingactions

import (
	"context"
	"fmt"
	"sync"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	"github.com/portainer/portainer/api/internal/authorization"
	"github.com/portainer/portainer/api/internal/endpointutils"
	kubecli "github.com/portainer/portainer/api/kubernetes/cli"
	"github.com/rs/zerolog/log"
)

const (
	CleanNAPWithOverridePolicies      = "CleanNAPWithOverridePolicies"
	DeletePortainerK8sRegistrySecrets = "DeletePortainerK8sRegistrySecrets"
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
		_, err := service.clientFactory.GetKubeClient(endpoint)
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

func (service *PendingActionsService) executePendingAction(pendingAction portainer.PendingActions, endpoint *portainer.Endpoint) error {
	log.Debug().Msgf("Executing pending action %s for environment %d", pendingAction.Action, pendingAction.EndpointID)

	defer func() {
		log.Debug().Msgf("End executing pending action %s for environment %d", pendingAction.Action, pendingAction.EndpointID)
	}()

	switch pendingAction.Action {
	case CleanNAPWithOverridePolicies:
		if (pendingAction.ActionData == nil) || (pendingAction.ActionData.(portainer.EndpointGroupID) == 0) {
			service.authorizationService.CleanNAPWithOverridePolicies(service.dataStore, endpoint, nil)
			return nil
		}

		endpointGroupID := pendingAction.ActionData.(portainer.EndpointGroupID)
		endpointGroup, err := service.dataStore.EndpointGroup().Read(portainer.EndpointGroupID(endpointGroupID))
		if err != nil {
			log.Error().Err(err).Msgf("Error reading environment group to clean NAP with override policies for environment %d and environment group %d", endpoint.ID, endpointGroup.ID)
			return fmt.Errorf("failed to retrieve environment group %d: %w", endpointGroupID, err)
		}
		err = service.authorizationService.CleanNAPWithOverridePolicies(service.dataStore, endpoint, endpointGroup)
		if err != nil {
			log.Error().Err(err).Msgf("Error cleaning NAP with override policies for environment %d and environment group %d", endpoint.ID, endpointGroup.ID)
			return fmt.Errorf("failed to clean NAP with override policies for environment %d and environment group %d: %w", endpoint.ID, endpointGroup.ID, err)
		}

		return nil
	case DeletePortainerK8sRegistrySecrets:
		if pendingAction.ActionData == nil {
			return nil
		}

		registryData, err := convertToDeletePortainerK8sRegistrySecretsData(pendingAction.ActionData)
		if err != nil {
			return fmt.Errorf("failed to parse pendingActionData: %w", err)
		}

		err = service.DeleteKubernetesRegistrySecrets(endpoint, registryData)
		if err != nil {
			log.Warn().Err(err).Int("endpoint_id", int(endpoint.ID)).Msgf("Unable to delete kubernetes registry secrets")
			return fmt.Errorf("failed to delete kubernetes registry secrets for environment %d: %w", endpoint.ID, err)
		}

		return nil
	}

	return nil
}
