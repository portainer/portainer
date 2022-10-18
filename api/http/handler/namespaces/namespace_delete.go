package namespaces

import (
	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	"github.com/portainer/libhttp/response"
	httperrors "github.com/portainer/portainer/api/http/errors"
	"github.com/portainer/portainer/api/http/security"
	"net/http"
)

// @id namespaceDelete
// @summary Remove a namespace
// @description Remove a namespace
// @description **Access policy**: restricted
// @tags Namespace
// @security ApiKeyAuth
// @security jwt
// @param id path int true "namespace identifier"
// @success 204 "Success"
// @failure 400 "Invalid request"
// @failure 404 "Namespace not found"
// @failure 500 "Server error"
// @router /namespaces/{name} [delete]
func (handler *Handler) namespaceDelete(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	securityContext, err := security.RetrieveRestrictedRequestContext(r)
	if err != nil {
		return &httperror.HandlerError{StatusCode: http.StatusInternalServerError, Message: "Unable to retrieve info from request context", Err: err}
	}
	if !securityContext.IsAdmin {
		return &httperror.HandlerError{StatusCode: http.StatusForbidden, Message: "Permission denied to delete namespaces", Err: httperrors.ErrResourceAccessDenied}
	}

	name, err := request.RetrieveRouteVariableValue(r, "name")
	if err != nil {
		return &httperror.HandlerError{StatusCode: http.StatusBadRequest, Message: "Invalid namespaces identifier route variable", Err: err}
	}

	namespace, err := handler.DataStore.Namespace().Namespace(name)
	if handler.DataStore.IsErrObjectNotFound(err) {
		return &httperror.HandlerError{StatusCode: http.StatusNotFound, Message: "Unable to find a namespaces with the specified identifier inside the database", Err: err}
	} else if err != nil {
		return &httperror.HandlerError{StatusCode: http.StatusInternalServerError, Message: "Unable to find a namespaces with the specified identifier inside the database", Err: err}
	} else {
		if len(namespace.Containers) > 0 {
			return &httperror.HandlerError{StatusCode: http.StatusBadRequest, Message: "Unable to remove the namespace because it is in use", Err: err}
		}
	}

	err = handler.DataStore.Namespace().DeleteNamespace(name)
	if err != nil {
		return &httperror.HandlerError{StatusCode: http.StatusInternalServerError, Message: "Unable to remove the namespaces from the database", Err: err}
	}

	return response.Empty(w)
}
