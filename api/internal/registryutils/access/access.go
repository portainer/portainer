package access

import (
	"errors"
	"fmt"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	"github.com/portainer/portainer/api/http/security"
	"github.com/portainer/portainer/api/internal/endpointutils"
	"github.com/portainer/portainer/api/kubernetes"
	"github.com/portainer/portainer/api/kubernetes/cli"
)

func hasPermission(
	dataStore dataservices.DataStore,
	k8sClientFactory *cli.ClientFactory,
	userID portainer.UserID,
	endpointID portainer.EndpointID,
	registry *portainer.Registry,
) (hasPermission bool, err error) {
	user, err := dataStore.User().Read(userID)
	if err != nil {
		return false, err
	}

	if user.Role == portainer.AdministratorRole {
		return true, nil
	}

	endpoint, err := dataStore.Endpoint().Endpoint(endpointID)
	if err != nil {
		return false, err
	}

	teamMemberships, err := dataStore.TeamMembership().TeamMembershipsByUserID(userID)
	if err != nil {
		return false, err
	}

	// validate access for kubernetes namespaces (leverage registry.RegistryAccesses[endpointId].Namespaces)
	if endpointutils.IsKubernetesEndpoint(endpoint) && k8sClientFactory != nil {
		kcl, err := k8sClientFactory.GetPrivilegedKubeClient(endpoint)
		if err != nil {
			return false, fmt.Errorf("unable to retrieve kubernetes client to validate registry access: %w", err)
		}
		accessPolicies, err := kcl.GetNamespaceAccessPolicies()
		if err != nil {
			return false, fmt.Errorf("unable to retrieve environment's namespaces policies to validate registry access: %w", err)
		}

		authorizedNamespaces := registry.RegistryAccesses[endpointID].Namespaces

		for _, namespace := range authorizedNamespaces {
			// when the default namespace is authorized to use a registry, all users have the ability to use it
			// unless the default namespace is restricted: in this case continue to search for other potential accesses authorizations
			if namespace == kubernetes.DefaultNamespace && !endpoint.Kubernetes.Configuration.RestrictDefaultNamespace {
				return true, nil
			}

			namespacePolicy := accessPolicies[namespace]
			if security.AuthorizedAccess(user.ID, teamMemberships, namespacePolicy.UserAccessPolicies, namespacePolicy.TeamAccessPolicies) {
				return true, nil
			}
		}
		return false, nil
	}

	// validate access for docker environments
	// leverage registry.RegistryAccesses[endpointId].UserAccessPolicies (direct access)
	// and registry.RegistryAccesses[endpointId].TeamAccessPolicies (indirect access via his teams)
	hasPermission = security.AuthorizedRegistryAccess(registry, user, teamMemberships, endpointID)

	return hasPermission, nil
}

// GetAccessibleRegistry get the registry if the user has permission
func GetAccessibleRegistry(
	dataStore dataservices.DataStore,
	k8sClientFactory *cli.ClientFactory,
	userID portainer.UserID,
	endpointID portainer.EndpointID,
	registryID portainer.RegistryID,
) (registry *portainer.Registry, err error) {

	registry, err = dataStore.Registry().Read(registryID)
	if err != nil {
		return
	}

	hasPermission, err := hasPermission(dataStore, k8sClientFactory, userID, endpointID, registry)
	if err != nil {
		return
	}

	if !hasPermission {
		err = errors.New("user does not has permission to get the registry")
		return nil, err
	}

	return
}
