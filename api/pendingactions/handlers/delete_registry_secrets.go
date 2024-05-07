package handlers

import (
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	"github.com/portainer/portainer/api/internal/authorization"
	kubecli "github.com/portainer/portainer/api/kubernetes/cli"
)

type HandlerDeleteRegistrySecrets struct {
	authorizationService *authorization.Service
	dataStore            dataservices.DataStore
	kubeFactory          *kubecli.ClientFactory
}

func NewHandlerDeleteRegistrySecrets(
	authorizationService *authorization.Service,
	dataStore dataservices.DataStore,
	kubeFactory *kubecli.ClientFactory,
) *HandlerDeleteRegistrySecrets {
	return &HandlerDeleteRegistrySecrets{
		authorizationService: authorizationService,
		dataStore:            dataStore,
		kubeFactory:          kubeFactory,
	}
}

type DeletePortainerK8sRegistrySecretsData struct {
	RegistryID portainer.RegistryID `json:"RegistryID"`
	Namespaces []string             `json:"Namespaces"`
}

func (h *HandlerDeleteRegistrySecrets) Execute(pa portainer.PendingAction, endpoint *portainer.Endpoint) error {
	if endpoint == nil || pa.ActionData == nil {
		return nil
	}

	var registryData DeletePortainerK8sRegistrySecretsData
	err := pa.UnmarshallActionData(&registryData)
	if err != nil {
		return err
	}

	kubeClient, err := h.kubeFactory.GetKubeClient(endpoint)
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
