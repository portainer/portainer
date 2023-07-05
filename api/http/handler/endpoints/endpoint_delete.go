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
	"github.com/rs/zerolog/log"
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
// @failure 403 "Permission denied"
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
		return httperror.InternalServerError("Unable to read the environment record from the database", err)
	}

	if endpoint.TLSConfig.TLS {
		folder := strconv.Itoa(endpointID)
		err = handler.FileService.DeleteTLSFiles(folder)
		if err != nil {
			log.Error().Err(err).Msgf("Unable to remove TLS files from disk when deleting endpoint %d", endpointID)
		}
	}

	err = handler.DataStore.Snapshot().Delete(portainer.EndpointID(endpointID))
	if err != nil {
		log.Warn().Err(err).Msgf("Unable to remove the snapshot from the database")
	}

	handler.ProxyManager.DeleteEndpointProxy(endpoint.ID)

	err = handler.DataStore.EndpointRelation().DeleteEndpointRelation(endpoint.ID)
	if err != nil {
		log.Warn().Err(err).Msgf("Unable to remove environment relation from the database")
	}

	for _, tagID := range endpoint.TagIDs {
		err = handler.DataStore.Tag().UpdateTagFunc(tagID, func(tag *portainer.Tag) {
			delete(tag.Endpoints, endpoint.ID)
		})

		if handler.DataStore.IsErrObjectNotFound(err) {
			log.Warn().Err(err).Msgf("Unable to find tag inside the database")
		} else if err != nil {
			log.Warn().Err(err).Msgf("Unable to delete tag relation from the database")
		}
	}

	edgeGroups, err := handler.DataStore.EdgeGroup().ReadAll()
	if err != nil {
		log.Warn().Err(err).Msgf("Unable to retrieve edge groups from the database")
	}

	for _, edgeGroup := range edgeGroups {
		err = handler.DataStore.EdgeGroup().UpdateEdgeGroupFunc(edgeGroup.ID, func(g *portainer.EdgeGroup) {
			g.Endpoints = removeElement(g.Endpoints, endpoint.ID)
		})
		if err != nil {
			log.Warn().Err(err).Msgf("Unable to update edge group")
		}
	}

	edgeStacks, err := handler.DataStore.EdgeStack().EdgeStacks()
	if err != nil {
		log.Warn().Err(err).Msgf("Unable to retrieve edge stacks from the database")
	}

	for idx := range edgeStacks {
		edgeStack := &edgeStacks[idx]
		if _, ok := edgeStack.Status[endpoint.ID]; ok {
			delete(edgeStack.Status, endpoint.ID)
			err = handler.DataStore.EdgeStack().UpdateEdgeStack(edgeStack.ID, edgeStack)
			if err != nil {
				log.Warn().Err(err).Msgf("Unable to update edge stack")
			}
		}
	}

	registries, err := handler.DataStore.Registry().ReadAll()
	if err != nil {
		log.Warn().Err(err).Msgf("Unable to retrieve registries from the database")
	}

	for idx := range registries {
		registry := &registries[idx]
		if _, ok := registry.RegistryAccesses[endpoint.ID]; ok {
			delete(registry.RegistryAccesses, endpoint.ID)
			err = handler.DataStore.Registry().Update(registry.ID, registry)
			if err != nil {
				log.Warn().Err(err).Msgf("Unable to update registry accesses")
			}
		}
	}

	if endpointutils.IsEdgeEndpoint(endpoint) {
		edgeJobs, err := handler.DataStore.EdgeJob().ReadAll()
		if err != nil {
			log.Warn().Err(err).Msgf("Unable to retrieve edge jobs from the database")
		}

		for idx := range edgeJobs {
			edgeJob := &edgeJobs[idx]
			if _, ok := edgeJob.Endpoints[endpoint.ID]; ok {
				err = handler.DataStore.EdgeJob().UpdateEdgeJobFunc(edgeJob.ID, func(j *portainer.EdgeJob) {
					delete(j.Endpoints, endpoint.ID)
				})

				if err != nil {
					log.Warn().Err(err).Msgf("Unable to update edge job")
				}
			}
		}
	}

	err = handler.DataStore.Endpoint().DeleteEndpoint(portainer.EndpointID(endpointID))
	if err != nil {
		return httperror.InternalServerError("Unable to remove environment from the database", err)
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
