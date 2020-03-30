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
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve edge groups from the database", err}
	}
	edgeGroupsViewModel := []portainer.EdgeGroup{}
	for _, edgeGroup := range edgeGroups {
		if edgeGroup.Dynamic {
			endpoints, err := handler.getEndpointsByTags(edgeGroup.TagIDs)
			if err != nil {
				return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve endpoints and endpoint groups for edge group", err}
			}

			edgeGroup.Endpoints = endpoints
		}
		edgeGroupsViewModel = append(edgeGroupsViewModel, edgeGroup)
	}

	return response.JSON(w, edgeGroupsViewModel)
}
