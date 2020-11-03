package users

import (
	"net/http"

	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	"github.com/portainer/libhttp/response"
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/http/errors"
	"github.com/portainer/portainer/api/http/security"
)

// GET request on /api/users/:id/namespaces
// returns user's role authorizations of all namespaces in all k8s endpoints
func (handler *Handler) userNamespaces(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	userID, err := request.RetrieveNumericRouteVariableValue(r, "id")
	if err != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid user identifier route variable", err}
	}

	tokenData, err := security.RetrieveTokenData(r)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve user authentication token", err}
	}

	if tokenData.Role != portainer.AdministratorRole && tokenData.ID != portainer.UserID(userID) {
		return &httperror.HandlerError{http.StatusForbidden, "Permission denied to retrieve user namespaces", errors.ErrUnauthorized}
	}

	endpoints, err := handler.DataStore.Endpoint().Endpoints()
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve user namespace data", err}
	}

	// key: endpointID, value: a map between namespace and user's role authorizations
	results := make(map[int]map[string]portainer.Authorizations)
	for _, endpoint := range endpoints {

		// skip non k8s endpoints
		if endpoint.Type != portainer.KubernetesLocalEnvironment ||
			endpoint.Type != portainer.AgentOnKubernetesEnvironment ||
			endpoint.Type != portainer.EdgeAgentOnKubernetesEnvironment {
			continue
		}

		endpointRole, err := handler.AuthorizationService.GetUserEndpointRole(userID, int(endpoint.ID))
		if err != nil {
			break
		}

		// no endpoint role for the user, continue
		if endpointRole == nil {
			continue
		}

		kcl, err := handler.K8sClientFactory.GetKubeClient(&endpoint)
		if err != nil {
			break
		}

		namespaces, err := kcl.GetNamespaces()
		if err != nil {
			break
		}

		accessPolicies, err := kcl.GetNamespaceAccessPolicies()
		if err != nil {
			break
		}
		// update the namespace access policies based on user's role, also in configmap.
		accessPolicies, hasChange, err := handler.AuthorizationService.UpdateUserNamespaceAccessPolicies(
			userID, &endpoint, accessPolicies,
		)
		if hasChange {
			err = kcl.UpdateNamespaceAccessPolicies(accessPolicies)
			if err != nil {
				break
			}
		}

		namespaceAuthorizations, err := handler.AuthorizationService.GetUserNamespaceAuthorizations(
			userID, int(endpoint.ID), accessPolicies, namespaces, endpointRole.Authorizations,
			endpoint.Kubernetes.Configuration,
		)
		if err != nil {
			break
		}

		results[int(endpoint.ID)] = namespaceAuthorizations
	}

	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve user namespace data", err}
	}

	return response.JSON(w, results)
}
