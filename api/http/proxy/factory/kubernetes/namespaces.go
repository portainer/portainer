package kubernetes

import (
	"net/http"

	"github.com/pkg/errors"
	portainer "github.com/portainer/portainer/api"
)

func (transport *baseTransport) proxyNamespaceDeleteOperation(request *http.Request, namespace string) (*http.Response, error) {
	if err := transport.tokenManager.kubecli.NamespaceAccessPoliciesDeleteNamespace(namespace); err != nil {
		return nil, errors.WithMessagef(err, "failed to delete a namespace [%s] from portainer config", namespace)
	}

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

	stacks, err := transport.dataStore.Stack().Stacks()
	if err != nil {
		return nil, err
	}

	for _, s := range stacks {
		if s.Namespace == namespace && s.EndpointID == transport.endpoint.ID {
			if err := transport.dataStore.Stack().DeleteStack(s.ID); err != nil {
				return nil, err
			}
		}
	}

	return transport.executeKubernetesRequest(request)
}
