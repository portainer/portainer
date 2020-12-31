package endpointgroups

import (
	"net/http"

	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	"github.com/portainer/libhttp/response"
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/bolt/errors"
)

// Attach an endpoint to an endpoint group
// @summary Attach an endpoint to an endpoint group
// @description
// @tags EndpointGroups
// @security ApiKeyAuth
// @accept json
// @produce json
// @param id path int true "endpoint group id"
// @param endpointId path int true "endpoint id"
// @success 204
// @failure 400,500
// @router /endpoint_groups/{id}/endpoints/{endpointId} [post]
func (handler *Handler) endpointGroupAddEndpoint(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	endpointGroupID, err := request.RetrieveNumericRouteVariableValue(r, "id")
	if err != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid endpoint group identifier route variable", err}
	}

	endpointID, err := request.RetrieveNumericRouteVariableValue(r, "endpointId")
	if err != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid endpoint identifier route variable", err}
	}

	endpointGroup, err := handler.DataStore.EndpointGroup().EndpointGroup(portainer.EndpointGroupID(endpointGroupID))
	if err == errors.ErrObjectNotFound {
		return &httperror.HandlerError{http.StatusNotFound, "Unable to find an endpoint group with the specified identifier inside the database", err}
	} else if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to find an endpoint group with the specified identifier inside the database", err}
	}

	endpoint, err := handler.DataStore.Endpoint().Endpoint(portainer.EndpointID(endpointID))
	if err == errors.ErrObjectNotFound {
		return &httperror.HandlerError{http.StatusNotFound, "Unable to find an endpoint with the specified identifier inside the database", err}
	} else if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to find an endpoint with the specified identifier inside the database", err}
	}

	endpoint.GroupID = endpointGroup.ID

	err = handler.DataStore.Endpoint().UpdateEndpoint(endpoint.ID, endpoint)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to persist endpoint changes inside the database", err}
	}

	err = handler.updateEndpointRelations(endpoint, endpointGroup)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to persist endpoint relations changes inside the database", err}
	}

	return response.Empty(w)
}
