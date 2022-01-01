package registryutils

import (
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
)

func isRegistryAssignedToNamespace(registry portainer.Registry, endpointID portainer.EndpointID, namespace string) (in bool) {
	for _, ns := range registry.RegistryAccesses[endpointID].Namespaces {
		if ns == namespace {
			return true
		}
	}

	return
}

func RefreshEcrSecret(cli portainer.KubeClient, endpoint *portainer.Endpoint, dataStore dataservices.DataStore, namespace string) (err error) {
	registries, err := dataStore.Registry().Registries()
	if err != nil {
		return
	}

	for _, registry := range registries {
		if registry.Type != portainer.EcrRegistry {
			continue
		}

		if !isRegistryAssignedToNamespace(registry, endpoint.ID, namespace) {
			continue
		}

		err = EnsureRegTokenValid(dataStore, &registry)
		if err != nil {
			return
		}

		err = cli.DeleteRegistrySecret(&registry, namespace)
		if err != nil {
			return
		}

		err = cli.CreateRegistrySecret(&registry, namespace)
		if err != nil {
			return
		}
	}

	return
}
