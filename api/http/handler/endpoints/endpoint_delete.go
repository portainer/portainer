package endpoints

import (
	"net/http"
	"strconv"

	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	"github.com/portainer/libhttp/response"
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/bolt/errors"
)

// Delete endpoint
// @summary Deletes an endpoint
// @description
// @tags Endpoints
// @security ApiKeyAuth
// @accept json
// @produce json
// @param id path int true "endpoint id"
// @success 204
// @failure 400,500
// @router /endpoints/{id} [delete]
func (handler *Handler) endpointDelete(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	endpointID, err := request.RetrieveNumericRouteVariableValue(r, "id")
	if err != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid endpoint identifier route variable", err}
	}

	endpoint, err := handler.DataStore.Endpoint().Endpoint(portainer.EndpointID(endpointID))
	if err == errors.ErrObjectNotFound {
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

	err = handler.DataStore.Endpoint().DeleteEndpoint(portainer.EndpointID(endpointID))
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to remove endpoint from the database", err}
	}

	handler.ProxyManager.DeleteEndpointProxy(endpoint)

	err = handler.DataStore.EndpointRelation().DeleteEndpointRelation(endpoint.ID)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to remove endpoint relation from the database", err}
	}

	for _, tagID := range endpoint.TagIDs {
		tag, err := handler.DataStore.Tag().Tag(tagID)
		if err != nil {
			return &httperror.HandlerError{http.StatusNotFound, "Unable to find tag inside the database", err}
		}

		delete(tag.Endpoints, endpoint.ID)

		err = handler.DataStore.Tag().UpdateTag(tagID, tag)
		if err != nil {
			return &httperror.HandlerError{http.StatusInternalServerError, "Unable to persist tag relation inside the database", err}
		}
	}

	edgeGroups, err := handler.DataStore.EdgeGroup().EdgeGroups()
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve edge groups from the database", err}
	}

	for idx := range edgeGroups {
		edgeGroup := &edgeGroups[idx]
		endpointIdx := findEndpointIndex(edgeGroup.Endpoints, endpoint.ID)
		if endpointIdx != -1 {
			edgeGroup.Endpoints = removeElement(edgeGroup.Endpoints, endpointIdx)
			err = handler.DataStore.EdgeGroup().UpdateEdgeGroup(edgeGroup.ID, edgeGroup)
			if err != nil {
				return &httperror.HandlerError{http.StatusInternalServerError, "Unable to update edge group", err}
			}
		}
	}

	edgeStacks, err := handler.DataStore.EdgeStack().EdgeStacks()
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve edge stacks from the database", err}
	}

	for idx := range edgeStacks {
		edgeStack := &edgeStacks[idx]
		if _, ok := edgeStack.Status[endpoint.ID]; ok {
			delete(edgeStack.Status, endpoint.ID)
			err = handler.DataStore.EdgeStack().UpdateEdgeStack(edgeStack.ID, edgeStack)
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
