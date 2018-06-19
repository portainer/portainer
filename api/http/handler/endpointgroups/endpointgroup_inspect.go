package endpointgroups

import (
	"net/http"

	"github.com/portainer/portainer"
	httperror "github.com/portainer/portainer/http/error"
	"github.com/portainer/portainer/http/request"
	"github.com/portainer/portainer/http/response"
)

// GET request on /api/endpoint_groups/:id
func (handler *Handler) endpointGroupInspect(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	endpointGroupID, err := request.RetrieveNumericRouteVariableValue(r, "id")
	if err != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid endpoint group identifier route variable", err}
	}

	endpointGroup, err := handler.EndpointGroupService.EndpointGroup(portainer.EndpointGroupID(endpointGroupID))
	if err == portainer.ErrObjectNotFound {
		return &httperror.HandlerError{http.StatusNotFound, "Unable to find an endpoint group with the specified identifier inside the database", err}
	} else if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to find an endpoint group with the specified identifier inside the database", err}
	}

	return response.JSON(w, endpointGroup)
}
