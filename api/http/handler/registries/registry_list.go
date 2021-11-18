package registries

import (
	"net/http"

	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/response"
	httperrors "github.com/portainer/portainer/api/http/errors"
	"github.com/portainer/portainer/api/http/security"
)

// @id RegistryList
// @summary List Registries
// @description List all registries based on the current user authorizations.
// @description Will return all registries if using an administrator account otherwise it
// @description will only return authorized registries.
// @description **Access policy**: restricted
// @tags registries
// @security ApiKeyAuth
// @security jwt
// @produce json
// @success 200 {array} portainer.Registry "Success"
// @failure 500 "Server error"
// @router /registries [get]
func (handler *Handler) registryList(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	securityContext, err := security.RetrieveRestrictedRequestContext(r)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve info from request context", err}
	}
	if !securityContext.IsAdmin {
		return &httperror.HandlerError{http.StatusForbidden, "Permission denied to list registries, use /endpoints/:endpointId/registries route instead", httperrors.ErrResourceAccessDenied}
	}

	registries, err := handler.DataStore.Registry().Registries()
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve registries from the database", err}
	}

	return response.JSON(w, registries)
}
