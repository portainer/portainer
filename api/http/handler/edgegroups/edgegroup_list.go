package edgegroups

import (
	"net/http"

	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/response"
	"github.com/portainer/portainer/api"
)

func (handler *Handler) edgeGroupList(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	edgeGroups, err := handler.EdgeGroupService.EdgeGroups()
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve Edge groups from the database", err}
	}
	decoratedEdgeGroups := []portainer.EdgeGroup{}
	for _, edgeGroup := range edgeGroups {
		if edgeGroup.Dynamic {
			endpoints, err := handler.getEndpointsByTags(edgeGroup.TagIDs)
			if err != nil {
				return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve endpoints and endpoint groups for Edge group", err}
			}

			edgeGroup.Endpoints = endpoints
		}
		decoratedEdgeGroups = append(decoratedEdgeGroups, edgeGroup)
	}

	return response.JSON(w, decoratedEdgeGroups)
}
