package pendingactions

import (
	"fmt"

	portainer "github.com/portainer/portainer/api"
	portaineree "github.com/portainer/portainer/api"
	"github.com/rs/zerolog/log"
)

type DeletePortainerK8sRegistrySecretsData struct {
	RegistryID portaineree.RegistryID `json:"RegistryID"`
	Namespaces []string               `json:"Namespaces"`
}

func (service *PendingActionsService) DeleteKubernetesRegistrySecrets(endpoint *portainer.Endpoint, registryData *DeletePortainerK8sRegistrySecretsData) error {
	if endpoint == nil || registryData == nil {
		return nil
	}

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

func convertToDeletePortainerK8sRegistrySecretsData(actionData interface{}) (*DeletePortainerK8sRegistrySecretsData, error) {
	var registryData DeletePortainerK8sRegistrySecretsData

	data, ok := actionData.(map[string]interface{})
	if !ok {
		return nil, fmt.Errorf("type assertion failed")
	}

	for key, value := range data {
		switch key {
		case "Namespaces":
			if namespaces, ok := value.([]interface{}); ok {
				registryData.Namespaces = make([]string, len(namespaces))
				for i, ns := range namespaces {
					if namespace, ok := ns.(string); ok {
						registryData.Namespaces[i] = namespace
					}
				}
			}
		case "RegistryID":
			if registryID, ok := value.(float64); ok {
				registryData.RegistryID = portaineree.RegistryID(registryID)
			}
		}
	}

	log.Debug().Msgf("DeletePortainerK8sRegistrySecrets: %+v", registryData)

	return &registryData, nil
}
