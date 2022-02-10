package endpoints

import (
	"net/http"
	"strconv"

	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	"github.com/portainer/libhttp/response"
	portainer "github.com/portainer/portainer/api"
)

// @id EndpointDelete
// @summary Remove an environment(endpoint)
// @description Remove an environment(endpoint).
// @description **Access policy**: administrator
// @tags endpoints
// @security ApiKeyAuth
// @security jwt
// @param id path int true "Environment(Endpoint) identifier"
// @success 204 "Success"
// @failure 400 "Invalid request"
// @failure 404 "Environment(Endpoint) not found"
// @failure 500 "Server error"
// @router /endpoints/{id} [delete]
func (handler *Handler) endpointDelete(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	endpointID, err := request.RetrieveNumericRouteVariableValue(r, "id")
	if err != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid environment identifier route variable", err}
	}

	endpoint, err := handler.dataStore.Endpoint().Endpoint(portainer.EndpointID(endpointID))
	if handler.dataStore.IsErrObjectNotFound(err) {
		return &httperror.HandlerError{http.StatusNotFound, "Unable to find an environment with the specified identifier inside the database", err}
	} else if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to find an environment with the specified identifier inside the database", err}
	}

	if endpoint.TLSConfig.TLS {
		folder := strconv.Itoa(endpointID)
		err = handler.FileService.DeleteTLSFiles(folder)
		if err != nil {
			return &httperror.HandlerError{http.StatusInternalServerError, "Unable to remove TLS files from disk", err}
		}
	}

	err = handler.dataStore.Endpoint().DeleteEndpoint(portainer.EndpointID(endpointID))
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to remove environment from the database", err}
	}

	handler.ProxyManager.DeleteEndpointProxy(endpoint.ID)

	err = handler.dataStore.EndpointRelation().DeleteEndpointRelation(endpoint.ID)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to remove environment relation from the database", err}
	}

	for _, tagID := range endpoint.TagIDs {
		tag, err := handler.dataStore.Tag().Tag(tagID)
		if err != nil {
			return &httperror.HandlerError{http.StatusNotFound, "Unable to find tag inside the database", err}
		}

		delete(tag.Endpoints, endpoint.ID)

		err = handler.dataStore.Tag().UpdateTag(tagID, tag)
		if err != nil {
			return &httperror.HandlerError{http.StatusInternalServerError, "Unable to persist tag relation inside the database", err}
		}
	}

	edgeGroups, err := handler.dataStore.EdgeGroup().EdgeGroups()
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve edge groups from the database", err}
	}

	for idx := range edgeGroups {
		edgeGroup := &edgeGroups[idx]
		endpointIdx := findEndpointIndex(edgeGroup.Endpoints, endpoint.ID)
		if endpointIdx != -1 {
			edgeGroup.Endpoints = removeElement(edgeGroup.Endpoints, endpointIdx)
			err = handler.dataStore.EdgeGroup().UpdateEdgeGroup(edgeGroup.ID, edgeGroup)
			if err != nil {
				return &httperror.HandlerError{http.StatusInternalServerError, "Unable to update edge group", err}
			}
		}
	}

	edgeStacks, err := handler.dataStore.EdgeStack().EdgeStacks()
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve edge stacks from the database", err}
	}

	for idx := range edgeStacks {
		edgeStack := &edgeStacks[idx]
		if _, ok := edgeStack.Status[endpoint.ID]; ok {
			delete(edgeStack.Status, endpoint.ID)
			err = handler.dataStore.EdgeStack().UpdateEdgeStack(edgeStack.ID, edgeStack)
			if err != nil {
				return &httperror.HandlerError{http.StatusInternalServerError, "Unable to update edge stack", err}
			}
		}
	}

	registries, err := handler.dataStore.Registry().Registries()
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve registries from the database", err}
	}

	for idx := range registries {
		registry := &registries[idx]
		if _, ok := registry.RegistryAccesses[endpoint.ID]; ok {
			delete(registry.RegistryAccesses, endpoint.ID)
			err = handler.dataStore.Registry().UpdateRegistry(registry.ID, registry)
			if err != nil {
				return &httperror.HandlerError{StatusCode: http.StatusInternalServerError, Message: "Unable to update registry accesses", Err: err}
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
