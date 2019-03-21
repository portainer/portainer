package resourcecontrols

import (
	"net/http"

	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	"github.com/portainer/libhttp/response"
	"github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/http/security"
)

// DELETE request on /api/resource_controls/:id
func (handler *Handler) resourceControlDelete(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	resourceControlID, err := request.RetrieveNumericRouteVariableValue(r, "id")
	if err != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid resource control identifier route variable", err}
	}

	resourceControl, err := handler.ResourceControlService.ResourceControl(portainer.ResourceControlID(resourceControlID))
	if err == portainer.ErrObjectNotFound {
		return &httperror.HandlerError{http.StatusNotFound, "Unable to find a resource control with the specified identifier inside the database", err}
	} else if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to find a resource control with with the specified identifier inside the database", err}
	}

	securityContext, err := security.RetrieveRestrictedRequestContext(r)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve info from request context", err}
	}

	if !security.AuthorizedResourceControlDeletion(resourceControl, securityContext) {
		return &httperror.HandlerError{http.StatusForbidden, "Permission denied to delete the resource control", portainer.ErrResourceAccessDenied}
	}

	err = handler.ResourceControlService.DeleteResourceControl(portainer.ResourceControlID(resourceControlID))
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to remove the resource control from the database", err}
	}

	return response.Empty(w)
}
