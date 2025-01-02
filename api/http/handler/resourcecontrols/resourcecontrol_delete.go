package resourcecontrols

import (
	"net/http"

	portainer "github.com/portainer/portainer/api"
	httperror "github.com/portainer/portainer/pkg/libhttp/error"
	"github.com/portainer/portainer/pkg/libhttp/request"
	"github.com/portainer/portainer/pkg/libhttp/response"
)

// @id ResourceControlDelete
// @summary Remove a resource control
// @description Remove a resource control.
// @description **Access policy**: administrator
// @tags resource_controls
// @security ApiKeyAuth
// @security jwt
// @param id path int true "Resource control identifier"
// @success 204 "Success"
// @failure 400 "Invalid request"
// @failure 404 "Resource control not found"
// @failure 500 "Server error"
// @router /resource_controls/{id} [delete]
func (handler *Handler) resourceControlDelete(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	resourceControlID, err := request.RetrieveNumericRouteVariableValue(r, "id")
	if err != nil {
		return httperror.BadRequest("Invalid resource control identifier route variable", err)
	}

	_, err = handler.DataStore.ResourceControl().Read(portainer.ResourceControlID(resourceControlID))
	if handler.DataStore.IsErrObjectNotFound(err) {
		return httperror.NotFound("Unable to find a resource control with the specified identifier inside the database", err)
	} else if err != nil {
		return httperror.InternalServerError("Unable to find a resource control with the specified identifier inside the database", err)
	}

	if err := handler.DataStore.ResourceControl().Delete(portainer.ResourceControlID(resourceControlID)); err != nil {
		return httperror.InternalServerError("Unable to remove the resource control from the database", err)
	}

	return response.Empty(w)
}
