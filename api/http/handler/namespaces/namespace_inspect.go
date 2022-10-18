package namespaces

import (
	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	"github.com/portainer/libhttp/response"
	"net/http"
)

// @summary Inspect a Namespaces
// @description Retrieve details abont a Namespaces.
// @description **Access policy**: administrator
// @tags Namespaces
// @security ApiKeyAuth
// @security jwt
// @accept json
// @produce json
// @param id path int true "Namespaces identifier"
// @success 200 {object} portainer.Namespaces "Success"
// @failure 400 "Invalid request"
// @failure 404 "Namespace not found"
// @failure 500 "Server error"
// @router /namespaces/{containerId} [get]
func (handler *Handler) namespaceInspect(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	containerId, err := request.RetrieveRouteVariableValue(r, "containerId")
	if err != nil {
		return &httperror.HandlerError{StatusCode: http.StatusBadRequest, Message: "Invalid namespaces identifier route variable", Err: err}
	}

	namespace, err := handler.DataStore.Namespace().NamespaceByContainerID(containerId)
	if err != nil {
		return httperror.InternalServerError("Unable to retrieve namespaces from the database", err)
	}
	return response.JSON(w, namespace)
}
