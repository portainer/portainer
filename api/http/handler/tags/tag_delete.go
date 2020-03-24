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

	endpoints, err := handler.EndpointService.Endpoints()
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve endpoints from the database", err}
	}

	for _, endpoint := range endpoints {
		tagIdx := findTagIndex(endpoint.TagIDs, tagID)
		if tagIdx != -1 {
			endpoint.TagIDs = removeElement(endpoint.TagIDs, tagIdx)
			err = handler.EndpointService.UpdateEndpoint(endpoint.ID, &endpoint)
			if err != nil {
				return &httperror.HandlerError{http.StatusInternalServerError, "Unable to update endpoint", err}
			}
		}
	}

	endpointGroups, err := handler.EndpointGroupService.EndpointGroups()
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve endpoints from the database", err}
	}

	for _, endpointGroup := range endpointGroups {
		tagIdx := findTagIndex(endpointGroup.TagIDs, tagID)
		if tagIdx != -1 {
			endpointGroup.TagIDs = removeElement(endpointGroup.TagIDs, tagIdx)
			err = handler.EndpointGroupService.UpdateEndpointGroup(endpointGroup.ID, &endpointGroup)
			if err != nil {
				return &httperror.HandlerError{http.StatusInternalServerError, "Unable to update endpoint group", err}
			}
		}
	}

	err = handler.TagService.DeleteTag(portainer.TagID(id))
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to remove the tag from the database", err}
	}

	return response.Empty(w)
}

func findTagIndex(tags []portainer.TagID, tagID portainer.TagID) int {
	for idx, etid := range tags {
		if tagID == etid {
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
