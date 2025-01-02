package registryutils

import (
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
)

func isRegistryAssignedToNamespace(registry portainer.Registry, endpointID portainer.EndpointID, namespace string) bool {
	for _, ns := range registry.RegistryAccesses[endpointID].Namespaces {
		if ns == namespace {
			return true
		}
	}

	return false
}

func RefreshEcrSecret(cli portainer.KubeClient, endpoint *portainer.Endpoint, dataStore dataservices.DataStore, namespace string) error {
	registries, err := dataStore.Registry().ReadAll()
	if err != nil {
		return err
	}

	for _, registry := range registries {
		if registry.Type != portainer.EcrRegistry {
			continue
		}

		if !isRegistryAssignedToNamespace(registry, endpoint.ID, namespace) {
			continue
		}

		if err := EnsureRegTokenValid(dataStore, &registry); err != nil {
			return err
		}

		if err := cli.DeleteRegistrySecret(registry.ID, namespace); err != nil {
			return err
		}

		if err := cli.CreateRegistrySecret(&registry, namespace); err != nil {
			return err
		}
	}

	return nil
}
