package tags

import (
	"net/http"

	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	"github.com/portainer/libhttp/response"
	"github.com/portainer/portainer/api"
)

// DELETE request on /api/tags/:id
func (handler *Handler) tagDelete(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	id, err := request.RetrieveNumericRouteVariableValue(r, "id")
	if err != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid tag identifier route variable", err}
	}
	tagID := portainer.TagID(id)

	err = handler.TagService.DeleteTag(tagID)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to remove the tag from the database", err}
	}

	tagAssociation, err := handler.TagAssociationService.TagAssociationByTagID(tagID)
	if err == portainer.ErrObjectNotFound {
		return &httperror.HandlerError{http.StatusNotFound, "Unable to find a tag association with the specified identifier inside the database", err}
	} else if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to find a tag association with the specified identifier inside the database", err}
	}

	for endpointID := range tagAssociation.Endpoints {
		endpoint, err := handler.EndpointService.Endpoint(endpointID)
		if err != nil {
			return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve endpoint from the database", err}
		}

		tagIdx := findTagIndex(endpoint.TagIDs, tagID)
		if tagIdx != -1 {
			endpoint.TagIDs = removeElement(endpoint.TagIDs, tagIdx)
			err = handler.EndpointService.UpdateEndpoint(endpoint.ID, endpoint)
			if err != nil {
				return &httperror.HandlerError{http.StatusInternalServerError, "Unable to update endpoint", err}
			}
		}
	}

	for endpointGroupID := range tagAssociation.EndpointGroups {
		endpointGroup, err := handler.EndpointGroupService.EndpointGroup(endpointGroupID)
		if err != nil {
			return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve endpoint group from the database", err}
		}

		tagIdx := findTagIndex(endpointGroup.TagIDs, tagID)
		if tagIdx != -1 {
			endpointGroup.TagIDs = removeElement(endpointGroup.TagIDs, tagIdx)
			err = handler.EndpointGroupService.UpdateEndpointGroup(endpointGroup.ID, endpointGroup)
			if err != nil {
				return &httperror.HandlerError{http.StatusInternalServerError, "Unable to update endpoint group", err}
			}
		}
	}

	err = handler.TagAssociationService.DeleteTagAssociation(tagID)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to remove the tag association from the database", err}
	}

	return response.Empty(w)
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
