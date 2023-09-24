package pendingactions

import (
	portainer "github.com/portainer/portainer/api"
	portaineree "github.com/portainer/portainer/api"
)

type DeletePortainerK8sRegistrySecretsData struct {
	RegistryID portaineree.RegistryID `json:"RegistryID"`
	Namespaces []string               `json:"Namespaces"`
}

func (service *PendingActionsService) DeleteKubernetesRegistrySecrets(endpoint *portainer.Endpoint, registryData DeletePortainerK8sRegistrySecretsData) error {
	kubeClient, err := service.clientFactory.GetKubeClient(endpoint)
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
