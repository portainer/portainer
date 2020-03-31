package edgegroups

import (
	"net/http"

	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	"github.com/portainer/libhttp/response"
	"github.com/portainer/portainer/api"
)

func (handler *Handler) edgeGroupInspect(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	edgeGroupID, err := request.RetrieveNumericRouteVariableValue(r, "id")
	if err != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid edge group identifier route variable", err}
	}

	edgeGroup, err := handler.EdgeGroupService.EdgeGroup(portainer.EdgeGroupID(edgeGroupID))
	if err == portainer.ErrObjectNotFound {
		return &httperror.HandlerError{http.StatusNotFound, "Unable to find an edge group with the specified identifier inside the database", err}
	} else if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to find an edge group with the specified identifier inside the database", err}
	}
	if edgeGroup.Dynamic {
		endpoints, err := handler.getEndpointsByTags(edgeGroup.TagIDs)
		if err != nil {
			return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve endpoints and endpoint groups for edge group", err}
		}

		edgeGroup.Endpoints = endpoints
	}

	return response.JSON(w, edgeGroup)
}
