package tags

import (
	"net/http"

	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	"github.com/portainer/libhttp/response"
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/bolt/errors"
	"github.com/portainer/portainer/api/internal/edge"
)

// tagDelete godoc
// @summary Delete a tag
// @description
// @tags tags
// @security ApiKeyAuth
// @produce json
// @param id path int true "tag id"
// @success 204
// @failure 500
// @router /tags/{id} [delete]
func (handler *Handler) tagDelete(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	id, err := request.RetrieveNumericRouteVariableValue(r, "id")
	if err != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid tag identifier route variable", err}
	}
	tagID := portainer.TagID(id)

	tag, err := handler.DataStore.Tag().Tag(tagID)
	if err == errors.ErrObjectNotFound {
		return &httperror.HandlerError{http.StatusNotFound, "Unable to find a tag with the specified identifier inside the database", err}
	} else if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to find a tag with the specified identifier inside the database", err}
	}

	for endpointID := range tag.Endpoints {
		endpoint, err := handler.DataStore.Endpoint().Endpoint(endpointID)
		if err != nil {
			return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve endpoint from the database", err}
		}

		tagIdx := findTagIndex(endpoint.TagIDs, tagID)
		if tagIdx != -1 {
			endpoint.TagIDs = removeElement(endpoint.TagIDs, tagIdx)
			err = handler.DataStore.Endpoint().UpdateEndpoint(endpoint.ID, endpoint)
			if err != nil {
				return &httperror.HandlerError{http.StatusInternalServerError, "Unable to update endpoint", err}
			}
		}
	}

	for endpointGroupID := range tag.EndpointGroups {
		endpointGroup, err := handler.DataStore.EndpointGroup().EndpointGroup(endpointGroupID)
		if err != nil {
			return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve endpoint group from the database", err}
		}

		tagIdx := findTagIndex(endpointGroup.TagIDs, tagID)
		if tagIdx != -1 {
			endpointGroup.TagIDs = removeElement(endpointGroup.TagIDs, tagIdx)
			err = handler.DataStore.EndpointGroup().UpdateEndpointGroup(endpointGroup.ID, endpointGroup)
			if err != nil {
				return &httperror.HandlerError{http.StatusInternalServerError, "Unable to update endpoint group", err}
			}
		}
	}

	endpoints, err := handler.DataStore.Endpoint().Endpoints()
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve endpoints from the database", err}
	}

	edgeGroups, err := handler.DataStore.EdgeGroup().EdgeGroups()
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve edge groups from the database", err}
	}

	edgeStacks, err := handler.DataStore.EdgeStack().EdgeStacks()
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve edge stacks from the database", err}
	}

	for _, endpoint := range endpoints {
		if (tag.Endpoints[endpoint.ID] || tag.EndpointGroups[endpoint.GroupID]) && (endpoint.Type == portainer.EdgeAgentOnDockerEnvironment || endpoint.Type == portainer.EdgeAgentOnKubernetesEnvironment) {
			err = handler.updateEndpointRelations(endpoint, edgeGroups, edgeStacks)
			if err != nil {
				return &httperror.HandlerError{http.StatusInternalServerError, "Unable to update endpoint relations in the database", err}
			}
		}
	}

	for idx := range edgeGroups {
		edgeGroup := &edgeGroups[idx]
		tagIdx := findTagIndex(edgeGroup.TagIDs, tagID)
		if tagIdx != -1 {
			edgeGroup.TagIDs = removeElement(edgeGroup.TagIDs, tagIdx)
			err = handler.DataStore.EdgeGroup().UpdateEdgeGroup(edgeGroup.ID, edgeGroup)
			if err != nil {
				return &httperror.HandlerError{http.StatusInternalServerError, "Unable to update endpoint group", err}
			}
		}
	}

	err = handler.DataStore.Tag().DeleteTag(tagID)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to remove the tag from the database", err}
	}

	return response.Empty(w)
}

func (handler *Handler) updateEndpointRelations(endpoint portainer.Endpoint, edgeGroups []portainer.EdgeGroup, edgeStacks []portainer.EdgeStack) error {
	endpointRelation, err := handler.DataStore.EndpointRelation().EndpointRelation(endpoint.ID)
	if err != nil {
		return err
	}

	endpointGroup, err := handler.DataStore.EndpointGroup().EndpointGroup(endpoint.GroupID)
	if err != nil {
		return err
	}

	endpointStacks := edge.EndpointRelatedEdgeStacks(&endpoint, endpointGroup, edgeGroups, edgeStacks)
	stacksSet := map[portainer.EdgeStackID]bool{}
	for _, edgeStackID := range endpointStacks {
		stacksSet[edgeStackID] = true
	}
	endpointRelation.EdgeStacks = stacksSet

	return handler.DataStore.EndpointRelation().UpdateEndpointRelation(endpoint.ID, endpointRelation)
}

func findTagIndex(tags []portainer.TagID, searchTagID portainer.TagID) int {
	for idx, tagID := range tags {
		if searchTagID == tagID {
			return idx
		}
	}
	return -1
}

func removeElement(arr []portainer.TagID, index int) []portainer.TagID {
	if index < 0 {
		return arr
	}
	lastTagIdx := len(arr) - 1
	arr[index] = arr[lastTagIdx]
	return arr[:lastTagIdx]
}
