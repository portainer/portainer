package endpoints

import (
	"net/http"

	"github.com/pkg/errors"
	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	"github.com/portainer/libhttp/response"
	portainer "github.com/portainer/portainer/api"
	bolterrors "github.com/portainer/portainer/api/bolt/errors"
	"github.com/portainer/portainer/api/http/security"
	"github.com/portainer/portainer/api/internal/endpointutils"
)

// GET request on /endpoints/{id}/registries?namespace
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
	if err == bolterrors.ErrObjectNotFound {
		return &httperror.HandlerError{http.StatusNotFound, "Unable to find an environment with the specified identifier inside the database", err}
	} else if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to find an environment with the specified identifier inside the database", err}
	}

	isAdmin := securityContext.IsAdmin

	registries, err := handler.DataStore.Registry().Registries()
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve registries from the database", err}
	}

	if endpointutils.IsKubernetesEndpoint(endpoint) {
		namespace, _ := request.RetrieveQueryParameter(r, "namespace", true)

		if namespace == "" && !isAdmin {
			return &httperror.HandlerError{StatusCode: http.StatusForbidden, Message: "Missing namespace query parameter", Err: errors.New("missing namespace query parameter")}
		}

		if namespace != "" {

			authorized, err := handler.isNamespaceAuthorized(endpoint, namespace, user.ID, securityContext.UserMemberships, isAdmin)
			if err != nil {
				return &httperror.HandlerError{http.StatusNotFound, "Unable to check for namespace authorization", err}
			}

			if !authorized {
				return &httperror.HandlerError{StatusCode: http.StatusForbidden, Message: "User is not authorized to use namespace", Err: errors.New("user is not authorized to use namespace")}
			}

			registries = filterRegistriesByNamespace(registries, endpoint.ID, namespace)
		}

	} else if !isAdmin {
		registries = security.FilterRegistries(registries, user, securityContext.UserMemberships, endpoint.ID)
	}

	for idx := range registries {
		hideRegistryFields(&registries[idx], !isAdmin)
	}

	return response.JSON(w, registries)
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

func filterRegistriesByNamespace(registries []portainer.Registry, endpointId portainer.EndpointID, namespace string) []portainer.Registry {
	if namespace == "" {
		return registries
	}

	filteredRegistries := []portainer.Registry{}

	for _, registry := range registries {
		for _, authorizedNamespace := range registry.RegistryAccesses[endpointId].Namespaces {
			if authorizedNamespace == namespace {
				filteredRegistries = append(filteredRegistries, registry)
			}
		}
	}

	return filteredRegistries
}

func hideRegistryFields(registry *portainer.Registry, hideAccesses bool) {
	registry.Password = ""
	registry.ManagementConfiguration = nil
	if hideAccesses {
		registry.RegistryAccesses = nil
	}
}
