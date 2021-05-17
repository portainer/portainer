package registries

import (
	"net/http"

	portainer "github.com/portainer/portainer/api"
	bolterrors "github.com/portainer/portainer/api/bolt/errors"
	httperrors "github.com/portainer/portainer/api/http/errors"
	"github.com/portainer/portainer/api/http/security"

	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	"github.com/portainer/libhttp/response"
)

// @id RegistryInspect
// @summary Inspect a registry
// @description Retrieve details about a registry.
// @description **Access policy**: administrator
// @tags registries
// @security jwt
// @produce json
// @param id path int true "Registry identifier"
// @success 200 {object} portainer.Registry "Success"
// @failure 400 "Invalid request"
// @failure 403 "Permission denied to access registry"
// @failure 404 "Registry not found"
// @failure 500 "Server error"
// @router /registries/{id} [get]
func (handler *Handler) registryInspect(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	securityContext, err := security.RetrieveRestrictedRequestContext(r)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve info from request context", err}
	}

	registryID, err := request.RetrieveNumericRouteVariableValue(r, "id")
	if err != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid registry identifier route variable", err}
	}

	registry, err := handler.DataStore.Registry().Registry(portainer.RegistryID(registryID))
	if err == bolterrors.ErrObjectNotFound {
		return &httperror.HandlerError{http.StatusNotFound, "Unable to find a registry with the specified identifier inside the database", err}
	} else if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to find a registry with the specified identifier inside the database", err}
	}

	// check user access for registry
	if !securityContext.IsAdmin {
		user, err := handler.DataStore.User().User(securityContext.UserID)
		if err != nil {
			return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve user from the database", err}
		}

		endpointID, err := request.RetrieveNumericQueryParameter(r, "endpointId", false)
		if err != nil {
			return &httperror.HandlerError{http.StatusBadRequest, "Invalid query parameter: endpointId", err}
		}

		if !security.AuthorizedRegistryAccess(registry, user, securityContext.UserMemberships, portainer.EndpointID(endpointID)) {
			return &httperror.HandlerError{http.StatusForbidden, "Access denied to resource", httperrors.ErrResourceAccessDenied}
		}
	}

	hideAccesses := !securityContext.IsAdmin
	hideFields(registry, hideAccesses)
	return response.JSON(w, registry)
}
