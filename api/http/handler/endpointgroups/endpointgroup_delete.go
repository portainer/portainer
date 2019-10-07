package endpointgroups

import (
	"net/http"

	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	"github.com/portainer/libhttp/response"
	"github.com/portainer/portainer/api"
)

// DELETE request on /api/endpoint_groups/:id
func (handler *Handler) endpointGroupDelete(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	endpointGroupID, err := request.RetrieveNumericRouteVariableValue(r, "id")
	if err != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid endpoint group identifier route variable", err}
	}

	if endpointGroupID == 1 {
		return &httperror.HandlerError{http.StatusForbidden, "Unable to remove the default 'Unassigned' group", portainer.ErrCannotRemoveDefaultGroup}
	}

	_, err = handler.EndpointGroupService.EndpointGroup(portainer.EndpointGroupID(endpointGroupID))
	if err == portainer.ErrObjectNotFound {
		return &httperror.HandlerError{http.StatusNotFound, "Unable to find an endpoint group with the specified identifier inside the database", err}
	} else if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to find an endpoint group with the specified identifier inside the database", err}
	}

	err = handler.EndpointGroupService.DeleteEndpointGroup(portainer.EndpointGroupID(endpointGroupID))
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to remove the endpoint group from the database", err}
	}

	endpoints, err := handler.EndpointService.Endpoints()
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve endpoints from the database", err}
	}

	updateAuthorizations := false
	for _, endpoint := range endpoints {
		if endpoint.GroupID == portainer.EndpointGroupID(endpointGroupID) {
			updateAuthorizations = true
			endpoint.GroupID = portainer.EndpointGroupID(1)
			err = handler.EndpointService.UpdateEndpoint(endpoint.ID, &endpoint)
			if err != nil {
				return &httperror.HandlerError{http.StatusInternalServerError, "Unable to update endpoint", err}
			}
		}
	}

	if updateAuthorizations {
		err = handler.AuthorizationService.UpdateUsersAuthorizations()
		if err != nil {
			return &httperror.HandlerError{http.StatusInternalServerError, "Unable to update user authorizations", err}
		}
	}

	return response.Empty(w)
}
