package handlers

import (
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	"github.com/portainer/portainer/api/internal/authorization"
	kubecli "github.com/portainer/portainer/api/kubernetes/cli"
	"github.com/portainer/portainer/api/pendingactions/actions"
)

type (
	HandlerDeleteK8sRegistrySecrets struct {
		authorizationService *authorization.Service
		dataStore            dataservices.DataStore
		kubeFactory          *kubecli.ClientFactory
	}

	deleteK8sRegistrySecretsData struct {
		RegistryID portainer.RegistryID `json:"RegistryID"`
		Namespaces []string             `json:"Namespaces"`
	}
)

// NewDeleteK8sRegistrySecrets creates a new DeleteK8sRegistrySecrets pending action
func NewDeleteK8sRegistrySecrets(endpointID portainer.EndpointID, registryID portainer.RegistryID, namespaces []string) portainer.PendingAction {
	return portainer.PendingAction{
		EndpointID: endpointID,
		Action:     actions.DeletePortainerK8sRegistrySecrets,
		ActionData: &deleteK8sRegistrySecretsData{
			RegistryID: registryID,
			Namespaces: namespaces,
		},
	}
}

// NewHandlerDeleteRegistrySecrets creates a new handler to execute DeleteK8sRegistrySecrets pending action
func NewHandlerDeleteRegistrySecrets(
	authorizationService *authorization.Service,
	dataStore dataservices.DataStore,
	kubeFactory *kubecli.ClientFactory,
) *HandlerDeleteK8sRegistrySecrets {
	return &HandlerDeleteK8sRegistrySecrets{
		authorizationService: authorizationService,
		dataStore:            dataStore,
		kubeFactory:          kubeFactory,
	}
}

func (h *HandlerDeleteK8sRegistrySecrets) Execute(pa portainer.PendingAction, endpoint *portainer.Endpoint) error {
	if endpoint == nil || pa.ActionData == nil {
		return nil
	}

	var registryData deleteK8sRegistrySecretsData
	err := pa.UnmarshallActionData(&registryData)
	if err != nil {
		return err
	}

	kubeClient, err := h.kubeFactory.GetPrivilegedKubeClient(endpoint)
	if err != nil {
		return err
	}

	for _, namespace := range registryData.Namespaces {
		err = kubeClient.DeleteRegistrySecret(registryData.RegistryID, namespace)
		if err != nil {
			return err
		}
	}

	return nil
}
