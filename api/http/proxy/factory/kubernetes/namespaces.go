package kubernetes

import (
	"net/http"

	portainer "github.com/portainer/portainer/api"
)

func (transport *baseTransport) proxyNamespaceDeleteOperation(request *http.Request, namespace string) (*http.Response, error) {
	registries, err := transport.dataStore.Registry().Registries()
	if err != nil {
		return nil, err
	}

	for _, registry := range registries {
		for endpointID, registryAccessPolicies := range registry.RegistryAccesses {
			if endpointID != transport.endpoint.ID {
				continue
			}

			namespaces := []string{}
			for _, ns := range registryAccessPolicies.Namespaces {
				if ns == namespace {
					continue
				}
				namespaces = append(namespaces, ns)
			}

			if len(namespaces) != len(registryAccessPolicies.Namespaces) {
				updatedAccessPolicies := portainer.RegistryAccessPolicies{
					Namespaces:         namespaces,
					UserAccessPolicies: registryAccessPolicies.UserAccessPolicies,
					TeamAccessPolicies: registryAccessPolicies.TeamAccessPolicies,
				}

				registry.RegistryAccesses[endpointID] = updatedAccessPolicies
				err := transport.dataStore.Registry().UpdateRegistry(registry.ID, &registry)
				if err != nil {
					return nil, err
				}
			}
		}
	}
	return transport.executeKubernetesRequest(request, false)
}
