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
		endpointTags := []portainer.TagID{}
		needToSave := false
		for _, etid := range endpoint.TagIDs {
			if tagID == etid {
				needToSave = true
			} else {
				endpointTags = append(endpointTags, etid)
			}
		}
		if needToSave {
			endpoint.TagIDs = endpointTags
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
		tags := []portainer.TagID{}
		needToSave := false
		for _, etid := range endpointGroup.TagIDs {
			if tagID == etid {
				needToSave = true
			} else {
				tags = append(tags, etid)
			}
		}
		if needToSave {
			endpointGroup.TagIDs = tags
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
