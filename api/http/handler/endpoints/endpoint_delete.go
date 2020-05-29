package endpoints

import (
	"net/http"
	"strconv"

	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	"github.com/portainer/libhttp/response"
	"github.com/portainer/portainer/api"
)

// DELETE request on /api/endpoints/:id
func (handler *Handler) endpointDelete(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	if !handler.authorizeEndpointManagement {
		return &httperror.HandlerError{http.StatusServiceUnavailable, "Endpoint management is disabled", ErrEndpointManagementDisabled}
	}

	endpointID, err := request.RetrieveNumericRouteVariableValue(r, "id")
	if err != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid endpoint identifier route variable", err}
	}

	endpoint, err := handler.EndpointService.Endpoint(portainer.EndpointID(endpointID))
	if err == portainer.ErrObjectNotFound {
		return &httperror.HandlerError{http.StatusNotFound, "Unable to find an endpoint with the specified identifier inside the database", err}
	} else if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to find an endpoint with the specified identifier inside the database", err}
	}

	if endpoint.TLSConfig.TLS {
		folder := strconv.Itoa(endpointID)
		err = handler.FileService.DeleteTLSFiles(folder)
		if err != nil {
			return &httperror.HandlerError{http.StatusInternalServerError, "Unable to remove TLS files from disk", err}
		}
	}

	err = handler.EndpointService.DeleteEndpoint(portainer.EndpointID(endpointID))
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to remove endpoint from the database", err}
	}

	handler.ProxyManager.DeleteEndpointProxy(endpoint)

	if len(endpoint.UserAccessPolicies) > 0 || len(endpoint.TeamAccessPolicies) > 0 {
		err = handler.AuthorizationService.UpdateUsersAuthorizations()
		if err != nil {
			return &httperror.HandlerError{http.StatusInternalServerError, "Unable to update user authorizations", err}
		}
	}

	err = handler.EndpointRelationService.DeleteEndpointRelation(endpoint.ID)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to remove endpoint relation from the database", err}
	}

	for _, tagID := range endpoint.TagIDs {
		tag, err := handler.TagService.Tag(tagID)
		if err != nil {
			return &httperror.HandlerError{http.StatusNotFound, "Unable to find tag inside the database", err}
		}

		delete(tag.Endpoints, endpoint.ID)

		err = handler.TagService.UpdateTag(tagID, tag)
		if err != nil {
			return &httperror.HandlerError{http.StatusInternalServerError, "Unable to persist tag relation inside the database", err}
		}
	}

	edgeGroups, err := handler.EdgeGroupService.EdgeGroups()
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve edge groups from the database", err}
	}

	for idx := range edgeGroups {
		edgeGroup := &edgeGroups[idx]
		endpointIdx := findEndpointIndex(edgeGroup.Endpoints, endpoint.ID)
		if endpointIdx != -1 {
			edgeGroup.Endpoints = removeElement(edgeGroup.Endpoints, endpointIdx)
			err = handler.EdgeGroupService.UpdateEdgeGroup(edgeGroup.ID, edgeGroup)
			if err != nil {
				return &httperror.HandlerError{http.StatusInternalServerError, "Unable to update edge group", err}
			}
		}
	}

	edgeStacks, err := handler.EdgeStackService.EdgeStacks()
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve edge stacks from the database", err}
	}

	for idx := range edgeStacks {
		edgeStack := &edgeStacks[idx]
		if _, ok := edgeStack.Status[endpoint.ID]; ok {
			delete(edgeStack.Status, endpoint.ID)
			err = handler.EdgeStackService.UpdateEdgeStack(edgeStack.ID, edgeStack)
			if err != nil {
				return &httperror.HandlerError{http.StatusInternalServerError, "Unable to update edge stack", err}
			}
		}
	}

	return response.Empty(w)
}

func findEndpointIndex(tags []portainer.EndpointID, searchEndpointID portainer.EndpointID) int {
	for idx, tagID := range tags {
		if searchEndpointID == tagID {
			return idx
		}
	}
	return -1
}

func removeElement(arr []portainer.EndpointID, index int) []portainer.EndpointID {
	if index < 0 {
		return arr
	}
	lastTagIdx := len(arr) - 1
	arr[index] = arr[lastTagIdx]
	return arr[:lastTagIdx]
}
