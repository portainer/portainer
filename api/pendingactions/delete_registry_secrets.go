package pendingactions

import (
	"fmt"

	portainer "github.com/portainer/portainer/api"
	"github.com/rs/zerolog/log"
)

type DeletePortainerK8sRegistrySecretsData struct {
	RegistryID portainer.RegistryID `json:"RegistryID"`
	Namespaces []string             `json:"Namespaces"`
}

func (service *PendingActionsService) DeleteKubernetesRegistrySecrets(endpoint *portainer.Endpoint, registryData *DeletePortainerK8sRegistrySecretsData) error {
	if endpoint == nil || registryData == nil {
		return nil
	}

	kubeClient, err := service.kubeFactory.GetKubeClient(endpoint)
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

// Failure in this code is basically a bug.  So if we get one we should log it and continue.
func convertToDeletePortainerK8sRegistrySecretsData(actionData interface{}) (*DeletePortainerK8sRegistrySecretsData, error) {
	var registryData DeletePortainerK8sRegistrySecretsData

	// Due to the way data is stored and subsequently read from the database, we can't directly type assert the actionData to
	// the type DeletePortainerK8sRegistrySecretsData.  It's stored as a map[string]interface{} and we need to extract the
	// data from that map.
	if data, ok := actionData.(map[string]interface{}); ok {
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
				} else {
					// we shouldn't ever see this.  It's a bug if we do.
					log.Debug().Msgf("DeletePortainerK8sRegistrySecrets: Failed to convert Namespaces to []interface{}")
				}
			case "RegistryID":
				if registryID, ok := value.(float64); ok {
					registryData.RegistryID = portainer.RegistryID(registryID)
				} else {
					// we shouldn't ever see this.  It's a bug if we do.
					log.Debug().Msgf("DeletePortainerK8sRegistrySecrets: Failed to convert RegistryID to float64")
				}
			}
		}

		log.Debug().Msgf("DeletePortainerK8sRegistrySecrets: %+v", registryData)
	} else {
		// this should not happen.  It's a bug if it does. As the actionData is defined
		// by what portainer puts in it.  It never comes from a user or external source so it shouldn't fail.
		// Nevertheless we should check it in case of db corruption or developer mistake down the road
		return nil, fmt.Errorf("type assertion failed in convertToDeletePortainerK8sRegistrySecretsData")
	}

	return &registryData, nil
}
