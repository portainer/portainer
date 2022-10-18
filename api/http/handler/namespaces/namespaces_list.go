package namespaces

import (
	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/response"
	httperrors "github.com/portainer/portainer/api/http/errors"
	"github.com/portainer/portainer/api/http/security"
	"net/http"
)

// @id NamespacesList
// @summary List namespaces
// @description List all namespaces
// @description Will return all namespaces
// @description will only return namespaces.
// @description **Access policy**: namespaces
// @tags namespaces
// @security ApiKeyAuth
// @security jwt
// @produce json
// @success 200 {array} portainer.namespaces "Success"
// @failure 500 "Server error"
// @router /namespaces [get]
func (handler *Handler) namespacesList(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	securityContext, err := security.RetrieveRestrictedRequestContext(r)
	if err != nil {
		return &httperror.HandlerError{StatusCode: http.StatusInternalServerError, Message: "Unable to retrieve info from request context", Err: err}
	}
	if !securityContext.IsAdmin {
		return &httperror.HandlerError{StatusCode: http.StatusForbidden, Message: "Permission denied to list namespaces, use /namespaces/:namespaceId/namespaces route instead", Err: httperrors.ErrResourceAccessDenied}
	}

	namespaces, err := handler.DataStore.Namespace().Namespaces()
	if err != nil {
		return &httperror.HandlerError{StatusCode: http.StatusInternalServerError, Message: "Unable to retrieve namespaces from the database", Err: err}
	}

	return response.JSON(w, namespaces)
}
