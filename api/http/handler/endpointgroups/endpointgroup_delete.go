package endpointgroups

import (
	"errors"
	"net/http"

	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	"github.com/portainer/libhttp/response"
	portainer "github.com/portainer/portainer/api"
	bolterrors "github.com/portainer/portainer/api/bolt/errors"
)

// @summary Deletes an Endpoint Group
// @description
// @tags endpoint_groups
// @security jwt
// @accept json
// @produce json
// @param id path int true "Endpoint Group Id"
// @success 204
// @failure 400,500
// @router /endpoint_groups/{id} [delete]
func (handler *Handler) endpointGroupDelete(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	endpointGroupID, err := request.RetrieveNumericRouteVariableValue(r, "id")
	if err != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid endpoint group identifier route variable", err}
	}

	if endpointGroupID == 1 {
		return &httperror.HandlerError{http.StatusForbidden, "Unable to remove the default 'Unassigned' group", errors.New("Cannot remove the default endpoint group")}
	}

	endpointGroup, err := handler.DataStore.EndpointGroup().EndpointGroup(portainer.EndpointGroupID(endpointGroupID))
	if err == bolterrors.ErrObjectNotFound {
		return &httperror.HandlerError{http.StatusNotFound, "Unable to find an endpoint group with the specified identifier inside the database", err}
	} else if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to find an endpoint group with the specified identifier inside the database", err}
	}

	err = handler.DataStore.EndpointGroup().DeleteEndpointGroup(portainer.EndpointGroupID(endpointGroupID))
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to remove the endpoint group from the database", err}
	}

	endpoints, err := handler.DataStore.Endpoint().Endpoints()
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve endpoints from the database", err}
	}

	for _, endpoint := range endpoints {
		if endpoint.GroupID == portainer.EndpointGroupID(endpointGroupID) {
			endpoint.GroupID = portainer.EndpointGroupID(1)
			err = handler.DataStore.Endpoint().UpdateEndpoint(endpoint.ID, &endpoint)
			if err != nil {
				return &httperror.HandlerError{http.StatusInternalServerError, "Unable to update endpoint", err}
			}

			err = handler.updateEndpointRelations(&endpoint, nil)
			if err != nil {
				return &httperror.HandlerError{http.StatusInternalServerError, "Unable to persist endpoint relations changes inside the database", err}
			}
		}
	}

	for _, tagID := range endpointGroup.TagIDs {
		tag, err := handler.DataStore.Tag().Tag(tagID)
		if err != nil {
			return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve tag from the database", err}
		}

		delete(tag.EndpointGroups, endpointGroup.ID)

		err = handler.DataStore.Tag().UpdateTag(tagID, tag)
		if err != nil {
			return &httperror.HandlerError{http.StatusInternalServerError, "Unable to persist tag changes inside the database", err}
		}
	}

	return response.Empty(w)
}
