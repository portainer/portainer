package resourcecontrols

import (
	"net/http"

	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	"github.com/portainer/libhttp/response"
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/bolt/errors"
)

// @id
// @summary Remove a resource control
// @description Remove a resource control.
// @description **Access policy**: administrator
// @tags resource_controls
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
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid resource control identifier route variable", err}
	}

	_, err = handler.DataStore.ResourceControl().ResourceControl(portainer.ResourceControlID(resourceControlID))
	if err == errors.ErrObjectNotFound {
		return &httperror.HandlerError{http.StatusNotFound, "Unable to find a resource control with the specified identifier inside the database", err}
	} else if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to find a resource control with with the specified identifier inside the database", err}
	}

	err = handler.DataStore.ResourceControl().DeleteResourceControl(portainer.ResourceControlID(resourceControlID))
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to remove the resource control from the database", err}
	}

	return response.Empty(w)
}
