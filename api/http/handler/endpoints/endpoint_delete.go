package endpoints

import (
	"net/http"
	"strconv"

	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	"github.com/portainer/libhttp/response"
	portainer "github.com/portainer/portainer/api"
	httperrors "github.com/portainer/portainer/api/http/errors"
	"github.com/portainer/portainer/api/internal/endpointutils"
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
		return httperror.BadRequest("Invalid environment identifier route variable", err)
	}

	if handler.demoService.IsDemoEnvironment(portainer.EndpointID(endpointID)) {
		return httperror.Forbidden(httperrors.ErrNotAvailableInDemo.Error(), httperrors.ErrNotAvailableInDemo)
	}

	endpoint, err := handler.DataStore.Endpoint().Endpoint(portainer.EndpointID(endpointID))
	if handler.DataStore.IsErrObjectNotFound(err) {
		return httperror.NotFound("Unable to find an environment with the specified identifier inside the database", err)
	} else if err != nil {
		return httperror.InternalServerError("Unable to find an environment with the specified identifier inside the database", err)
	}

	if endpoint.TLSConfig.TLS {
		folder := strconv.Itoa(endpointID)
		err = handler.FileService.DeleteTLSFiles(folder)
		if err != nil {
			return httperror.InternalServerError("Unable to remove TLS files from disk", err)
		}
	}

	err = handler.DataStore.Snapshot().Delete(portainer.EndpointID(endpointID))
	if err != nil {
		return httperror.InternalServerError("Unable to remove the snapshot from the database", err)
	}

	err = handler.DataStore.Endpoint().DeleteEndpoint(portainer.EndpointID(endpointID))
	if err != nil {
		return httperror.InternalServerError("Unable to remove environment from the database", err)
	}

	handler.ProxyManager.DeleteEndpointProxy(endpoint.ID)

	err = handler.DataStore.EndpointRelation().DeleteEndpointRelation(endpoint.ID)
	if err != nil {
		return httperror.InternalServerError("Unable to remove environment relation from the database", err)
	}

	for _, tagID := range endpoint.TagIDs {
		err = handler.DataStore.Tag().UpdateTagFunc(tagID, func(tag *portainer.Tag) {
			delete(tag.Endpoints, endpoint.ID)
		})

		if handler.DataStore.IsErrObjectNotFound(err) {
			return httperror.NotFound("Unable to find tag inside the database", err)
		} else if err != nil {
			return httperror.InternalServerError("Unable to persist tag relation inside the database", err)
		}
	}

	edgeGroups, err := handler.DataStore.EdgeGroup().ReadAll()
	if err != nil {
		return httperror.InternalServerError("Unable to retrieve edge groups from the database", err)
	}

	for _, edgeGroup := range edgeGroups {
		err = handler.DataStore.EdgeGroup().UpdateEdgeGroupFunc(edgeGroup.ID, func(g *portainer.EdgeGroup) {
			g.Endpoints = removeElement(g.Endpoints, endpoint.ID)
		})
		if err != nil {
			return httperror.InternalServerError("Unable to update edge group", err)
		}
	}

	edgeStacks, err := handler.DataStore.EdgeStack().EdgeStacks()
	if err != nil {
		return httperror.InternalServerError("Unable to retrieve edge stacks from the database", err)
	}

	for idx := range edgeStacks {
		edgeStack := &edgeStacks[idx]
		if _, ok := edgeStack.Status[endpoint.ID]; ok {
			delete(edgeStack.Status, endpoint.ID)
			err = handler.DataStore.EdgeStack().UpdateEdgeStack(edgeStack.ID, edgeStack)
			if err != nil {
				return httperror.InternalServerError("Unable to update edge stack", err)
			}
		}
	}

	registries, err := handler.DataStore.Registry().ReadAll()
	if err != nil {
		return httperror.InternalServerError("Unable to retrieve registries from the database", err)
	}

	for idx := range registries {
		registry := &registries[idx]
		if _, ok := registry.RegistryAccesses[endpoint.ID]; ok {
			delete(registry.RegistryAccesses, endpoint.ID)
			err = handler.DataStore.Registry().Update(registry.ID, registry)
			if err != nil {
				return httperror.InternalServerError("Unable to update registry accesses", err)
			}
		}
	}

	if !endpointutils.IsEdgeEndpoint(endpoint) {
		return response.Empty(w)
	}

	edgeJobs, err := handler.DataStore.EdgeJob().ReadAll()
	if err != nil {
		return httperror.InternalServerError("Unable to retrieve edge jobs from the database", err)
	}

	for idx := range edgeJobs {
		edgeJob := &edgeJobs[idx]
		if _, ok := edgeJob.Endpoints[endpoint.ID]; ok {
			err = handler.DataStore.EdgeJob().UpdateEdgeJobFunc(edgeJob.ID, func(j *portainer.EdgeJob) {
				delete(j.Endpoints, endpoint.ID)
			})

			if err != nil {
				return httperror.InternalServerError("Unable to update edge job", err)
			}
		}
	}

	return response.Empty(w)
}

func removeElement(slice []portainer.EndpointID, elem portainer.EndpointID) []portainer.EndpointID {
	for i, id := range slice {
		if id == elem {
			slice[i] = slice[len(slice)-1]

			return slice[:len(slice)-1]
		}
	}

	return slice
}
