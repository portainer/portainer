package endpoints

import (
	"net/http"

	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	"github.com/portainer/libhttp/response"
	portainer "github.com/portainer/portainer/api"
	httperrors "github.com/portainer/portainer/api/http/errors"
	"github.com/portainer/portainer/api/http/security"
)

// @id endpointRegistryInspect
// @summary get registry for environment
// @description **Access policy**: authenticated
// @tags endpoints
// @security ApiKeyAuth
// @security jwt
// @produce json
// @param id path int true "identifier"
// @param registryId path int true "Registry identifier"
// @success 200 {object} portainer.Registry "Success"
// @failure 400 "Invalid request"
// @failure 403 "Permission denied"
// @failure 404 "Registry not found"
// @failure 500 "Server error"
// @router /endpoints/{id}/registries/{registryId} [get]
func (handler *Handler) endpointRegistryInspect(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	endpointID, err := request.RetrieveNumericRouteVariableValue(r, "id")
	if err != nil {
		return &httperror.HandlerError{StatusCode: http.StatusBadRequest, Message: "Invalid environment identifier route variable", Err: err}
	}

	registryID, err := request.RetrieveNumericRouteVariableValue(r, "registryId")
	if err != nil {
		return &httperror.HandlerError{StatusCode: http.StatusBadRequest, Message: "Invalid registry identifier route variable", Err: err}
	}

	registry, err := handler.DataStore.Registry().Registry(portainer.RegistryID(registryID))
	if handler.DataStore.IsErrObjectNotFound(err) {
		return &httperror.HandlerError{StatusCode: http.StatusNotFound, Message: "Unable to find a registry with the specified identifier inside the database", Err: err}
	} else if err != nil {
		return &httperror.HandlerError{StatusCode: http.StatusInternalServerError, Message: "Unable to find a registry with the specified identifier inside the database", Err: err}
	}

	securityContext, err := security.RetrieveRestrictedRequestContext(r)
	if err != nil {
		return &httperror.HandlerError{StatusCode: http.StatusInternalServerError, Message: "Unable to retrieve info from request context", Err: err}
	}

	user, err := handler.DataStore.User().User(securityContext.UserID)
	if err != nil {
		return &httperror.HandlerError{StatusCode: http.StatusInternalServerError, Message: "Unable to retrieve user from the database", Err: err}
	}

	if !security.AuthorizedRegistryAccess(registry, user, securityContext.UserMemberships, portainer.EndpointID(endpointID)) {
		return &httperror.HandlerError{StatusCode: http.StatusForbidden, Message: "Access denied to resource", Err: httperrors.ErrResourceAccessDenied}
	}

	hideRegistryFields(registry, !securityContext.IsAdmin)
	return response.JSON(w, registry)
}
