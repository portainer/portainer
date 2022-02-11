package endpoints

import (
	"net/http"

	"github.com/pkg/errors"
	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	"github.com/portainer/libhttp/response"
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/http/security"
	"github.com/portainer/portainer/api/internal/endpointutils"
)

// @id endpointRegistriesList
// @summary List Registries on environment
// @description List all registries based on the current user authorizations in current environment.
// @description **Access policy**: authenticated
// @tags endpoints
// @param namespace query string false "required if kubernetes environment, will show registries by namespace"
// @security ApiKeyAuth
// @security jwt
// @produce json
// @param id path int true "Environment(Endpoint) identifier"
// @success 200 {array} portainer.Registry "Success"
// @failure 500 "Server error"
// @router /endpoints/{id}/registries [get]
func (handler *Handler) endpointRegistriesList(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	securityContext, err := security.RetrieveRestrictedRequestContext(r)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve info from request context", err}
	}

	user, err := handler.DataStore.User().User(securityContext.UserID)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve user from the database", err}
	}

	endpointID, err := request.RetrieveNumericRouteVariableValue(r, "id")
	if err != nil {
		return &httperror.HandlerError{StatusCode: http.StatusBadRequest, Message: "Invalid environment identifier route variable", Err: err}
	}

	endpoint, err := handler.DataStore.Endpoint().Endpoint(portainer.EndpointID(endpointID))
	if handler.DataStore.IsErrObjectNotFound(err) {
		return &httperror.HandlerError{http.StatusNotFound, "Unable to find an environment with the specified identifier inside the database", err}
	} else if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to find an environment with the specified identifier inside the database", err}
	}

	isAdmin := securityContext.IsAdmin

	registries, err := handler.DataStore.Registry().Registries()
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve registries from the database", err}
	}

	registries, handleError := handler.filterRegistriesByAccess(r, registries, endpoint, user, securityContext.UserMemberships)
	if handleError != nil {
		return handleError
	}

	for idx := range registries {
		hideRegistryFields(&registries[idx], !isAdmin)
	}

	return response.JSON(w, registries)
}

func (handler *Handler) filterRegistriesByAccess(r *http.Request, registries []portainer.Registry, endpoint *portainer.Endpoint, user *portainer.User, memberships []portainer.TeamMembership) ([]portainer.Registry, *httperror.HandlerError) {
	if !endpointutils.IsKubernetesEndpoint(endpoint) {
		return security.FilterRegistries(registries, user, memberships, endpoint.ID), nil
	}

	return handler.filterKubernetesEndpointRegistries(r, registries, endpoint, user, memberships)
}

func (handler *Handler) filterKubernetesEndpointRegistries(r *http.Request, registries []portainer.Registry, endpoint *portainer.Endpoint, user *portainer.User, memberships []portainer.TeamMembership) ([]portainer.Registry, *httperror.HandlerError) {
	namespaceParam, _ := request.RetrieveQueryParameter(r, "namespace", true)
	isAdmin, err := security.IsAdmin(r)
	if err != nil {
		return nil, &httperror.HandlerError{StatusCode: http.StatusInternalServerError, Message: "Unable to check user role", Err: err}
	}

	if namespaceParam != "" {
		authorized, err := handler.isNamespaceAuthorized(endpoint, namespaceParam, user.ID, memberships, isAdmin)
		if err != nil {
			return nil, &httperror.HandlerError{StatusCode: http.StatusNotFound, Message: "Unable to check for namespace authorization", Err: err}
		}
		if !authorized {
			return nil, &httperror.HandlerError{StatusCode: http.StatusForbidden, Message: "User is not authorized to use namespace", Err: errors.New("user is not authorized to use namespace")}
		}

		return filterRegistriesByNamespaces(registries, endpoint.ID, []string{namespaceParam}), nil
	}

	if isAdmin {
		return registries, nil
	}

	return handler.filterKubernetesRegistriesByUserRole(r, registries, endpoint, user)
}

func (handler *Handler) isNamespaceAuthorized(endpoint *portainer.Endpoint, namespace string, userId portainer.UserID, memberships []portainer.TeamMembership, isAdmin bool) (bool, error) {
	if isAdmin || namespace == "" {
		return true, nil
	}

	if namespace == "default" {
		return true, nil
	}

	kcl, err := handler.K8sClientFactory.GetKubeClient(endpoint)
	if err != nil {
		return false, errors.Wrap(err, "unable to retrieve kubernetes client")
	}

	accessPolicies, err := kcl.GetNamespaceAccessPolicies()
	if err != nil {
		return false, errors.Wrap(err, "unable to retrieve environment's namespaces policies")
	}

	namespacePolicy, ok := accessPolicies[namespace]
	if !ok {
		return false, nil
	}

	return security.AuthorizedAccess(userId, memberships, namespacePolicy.UserAccessPolicies, namespacePolicy.TeamAccessPolicies), nil
}

func filterRegistriesByNamespaces(registries []portainer.Registry, endpointId portainer.EndpointID, namespaces []string) []portainer.Registry {
	filteredRegistries := []portainer.Registry{}

	for _, registry := range registries {
		if registryAccessPoliciesContainsNamespace(registry.RegistryAccesses[endpointId], namespaces) {
			filteredRegistries = append(filteredRegistries, registry)
		}
	}

	return filteredRegistries
}

func registryAccessPoliciesContainsNamespace(registryAccess portainer.RegistryAccessPolicies, namespaces []string) bool {
	for _, authorizedNamespace := range registryAccess.Namespaces {
		for _, namespace := range namespaces {
			if namespace == authorizedNamespace {
				return true
			}
		}
	}
	return false
}

func (handler *Handler) filterKubernetesRegistriesByUserRole(r *http.Request, registries []portainer.Registry, endpoint *portainer.Endpoint, user *portainer.User) ([]portainer.Registry, *httperror.HandlerError) {
	err := handler.requestBouncer.AuthorizedEndpointOperation(r, endpoint)
	if err == security.ErrAuthorizationRequired {
		return nil, &httperror.HandlerError{StatusCode: http.StatusForbidden, Message: "User is not authorized", Err: errors.New("missing namespace query parameter")}
	}
	if err != nil {
		return nil, &httperror.HandlerError{StatusCode: http.StatusInternalServerError, Message: "Unable to retrieve info from request context", Err: err}
	}

	userNamespaces, err := handler.userNamespaces(endpoint, user)
	if err != nil {
		return nil, &httperror.HandlerError{StatusCode: http.StatusInternalServerError, Message: "unable to retrieve user namespaces", Err: err}
	}

	return filterRegistriesByNamespaces(registries, endpoint.ID, userNamespaces), nil
}

func (handler *Handler) userNamespaces(endpoint *portainer.Endpoint, user *portainer.User) ([]string, error) {
	kcl, err := handler.K8sClientFactory.GetKubeClient(endpoint)
	if err != nil {
		return nil, err
	}

	namespaceAuthorizations, err := kcl.GetNamespaceAccessPolicies()
	if err != nil {
		return nil, err
	}

	userMemberships, err := handler.DataStore.TeamMembership().TeamMembershipsByUserID(user.ID)
	if err != nil {
		return nil, err
	}

	var userNamespaces []string
	for namespace, namespaceAuthorization := range namespaceAuthorizations {
		if _, ok := namespaceAuthorization.UserAccessPolicies[user.ID]; ok {
			userNamespaces = append(userNamespaces, namespace)
			continue
		}
		for _, userTeam := range userMemberships {
			if _, ok := namespaceAuthorization.TeamAccessPolicies[userTeam.TeamID]; ok {
				userNamespaces = append(userNamespaces, namespace)
				continue
			}
		}
	}
	return userNamespaces, nil
}

func hideRegistryFields(registry *portainer.Registry, hideAccesses bool) {
	registry.Password = ""
	registry.ManagementConfiguration = nil
	if hideAccesses {
		registry.RegistryAccesses = nil
	}
}
