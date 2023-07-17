package endpoints

import (
	"errors"
	"net/http"
	"strconv"

	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	"github.com/portainer/libhttp/response"
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	httperrors "github.com/portainer/portainer/api/http/errors"
	"github.com/portainer/portainer/api/internal/endpointutils"
	"github.com/portainer/portainer/pkg/featureflags"

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

	// This is a Portainer provisioned cloud environment
	deleteCluster, err := request.RetrieveBooleanQueryParameter(r, "deleteCluster", true)
	if err != nil {
		return httperror.BadRequest("Invalid boolean query parameter", err)
	}

	if handler.demoService.IsDemoEnvironment(portainer.EndpointID(endpointID)) {
		return httperror.Forbidden(httperrors.ErrNotAvailableInDemo.Error(), httperrors.ErrNotAvailableInDemo)
	}

	if featureflags.IsEnabled(portainer.FeatureNoTx) {
		err = handler.deleteEndpoint(handler.DataStore, portainer.EndpointID(endpointID), deleteCluster)
	} else {
		err = handler.DataStore.UpdateTx(func(tx dataservices.DataStoreTx) error {
			return handler.deleteEndpoint(tx, portainer.EndpointID(endpointID), deleteCluster)
		})
	}

	if err != nil {
		var handlerError *httperror.HandlerError
		if errors.As(err, &handlerError) {
			return handlerError
		}

		return httperror.InternalServerError("Unexpected error", err)
	}

	return response.Empty(w)
}

func (handler *Handler) deleteEndpoint(tx dataservices.DataStoreTx, endpointID portainer.EndpointID, deleteCluster bool) error {
	endpoint, err := tx.Endpoint().Endpoint(portainer.EndpointID(endpointID))
	if tx.IsErrObjectNotFound(err) {
		return httperror.NotFound("Unable to find an environment with the specified identifier inside the database", err)
	} else if err != nil {
		return httperror.InternalServerError("Unable to read the environment record from the database", err)
	}

	if endpoint.TLSConfig.TLS {
		folder := strconv.Itoa(int(endpointID))
		err = handler.FileService.DeleteTLSFiles(folder)
		if err != nil {
			log.Error().Err(err).Msgf("Unable to remove TLS files from disk when deleting endpoint %d", endpointID)
		}
	}

	err = tx.Snapshot().Delete(endpointID)
	if err != nil {
		log.Warn().Err(err).Msgf("Unable to remove the snapshot from the database")
	}

	handler.ProxyManager.DeleteEndpointProxy(endpoint.ID)

	if len(endpoint.UserAccessPolicies) > 0 || len(endpoint.TeamAccessPolicies) > 0 {
		err = handler.AuthorizationService.UpdateUsersAuthorizationsTx(tx)
		if err != nil {
			log.Warn().Err(err).Msgf("Unable to update user authorizations")
		}
	}

	err = tx.EndpointRelation().DeleteEndpointRelation(endpoint.ID)
	if err != nil {
		log.Warn().Err(err).Msgf("Unable to remove environment relation from the database")
	}

	for _, tagID := range endpoint.TagIDs {
		if featureflags.IsEnabled(portainer.FeatureNoTx) {
			err = handler.DataStore.Tag().UpdateTagFunc(tagID, func(tag *portainer.Tag) {
				delete(tag.Endpoints, endpoint.ID)
			})
		} else {
			var tag *portainer.Tag
			tag, err = tx.Tag().Read(tagID)
			if err == nil {
				delete(tag.Endpoints, endpoint.ID)
				err = tx.Tag().Update(tagID, tag)
			}
		}

		if handler.DataStore.IsErrObjectNotFound(err) {
			log.Warn().Err(err).Msgf("Unable to find tag inside the database")
		} else if err != nil {
			log.Warn().Err(err).Msgf("Unable to delete tag relation from the database")
		}
	}

	edgeGroups, err := tx.EdgeGroup().ReadAll()
	if err != nil {
		log.Warn().Err(err).Msgf("Unable to retrieve edge groups from the database")
	}

	for _, edgeGroup := range edgeGroups {
		if featureflags.IsEnabled(portainer.FeatureNoTx) {
			err = handler.DataStore.EdgeGroup().UpdateEdgeGroupFunc(edgeGroup.ID, func(g *portainer.EdgeGroup) {
				g.Endpoints = removeElement(g.Endpoints, endpoint.ID)
			})
		} else {
			edgeGroup.Endpoints = removeElement(edgeGroup.Endpoints, endpoint.ID)
			tx.EdgeGroup().Update(edgeGroup.ID, &edgeGroup)
		}

		if err != nil {
			log.Warn().Err(err).Msgf("Unable to update edge group")
		}
	}

	edgeStacks, err := tx.EdgeStack().EdgeStacks()
	if err != nil {
		log.Warn().Err(err).Msgf("Unable to retrieve edge stacks from the database")
	}

	for idx := range edgeStacks {
		edgeStack := &edgeStacks[idx]
		if _, ok := edgeStack.Status[endpoint.ID]; ok {
			delete(edgeStack.Status, endpoint.ID)
			err = tx.EdgeStack().UpdateEdgeStack(edgeStack.ID, edgeStack)
			if err != nil {
				log.Warn().Err(err).Msgf("Unable to update edge stack")
			}
		}
	}

	registries, err := tx.Registry().ReadAll()
	if err != nil {
		log.Warn().Err(err).Msgf("Unable to retrieve registries from the database")
	}

	for idx := range registries {
		registry := &registries[idx]
		if _, ok := registry.RegistryAccesses[endpoint.ID]; ok {
			delete(registry.RegistryAccesses, endpoint.ID)
			err = tx.Registry().Update(registry.ID, registry)
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
				if featureflags.IsEnabled(portainer.FeatureNoTx) {
					err = tx.EdgeJob().UpdateEdgeJobFunc(edgeJob.ID, func(j *portainer.EdgeJob) {
						delete(j.Endpoints, endpoint.ID)
					})
				} else {
					delete(edgeJob.Endpoints, endpoint.ID)
					err = tx.EdgeJob().Update(edgeJob.ID, edgeJob)
				}

				if err != nil {
					log.Warn().Err(err).Msgf("Unable to update edge job")
				}
			}
		}
	}

	err = tx.Endpoint().DeleteEndpoint(portainer.EndpointID(endpointID))
	if err != nil {
		return httperror.InternalServerError("Unable to delete the environment from the database", err)
	}

	return nil
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
