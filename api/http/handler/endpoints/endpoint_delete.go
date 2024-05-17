package endpoints

import (
	"errors"
	"fmt"
	"net/http"
	"slices"
	"strconv"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	"github.com/portainer/portainer/api/internal/endpointutils"
	httperror "github.com/portainer/portainer/pkg/libhttp/error"
	"github.com/portainer/portainer/pkg/libhttp/request"
	"github.com/portainer/portainer/pkg/libhttp/response"

	"github.com/rs/zerolog/log"
)

type DeleteMultiplePayload struct {
	Endpoints []struct {
		ID            int    `json:"id"`
		Name          string `json:"name"`
		DeleteCluster bool   `json:"deleteCluster"`
	} `json:"environments"`
}

func (payload *DeleteMultiplePayload) Validate(r *http.Request) error {
	if payload == nil || len(payload.Endpoints) == 0 {
		return fmt.Errorf("invalid request payload; you must provide a list of nodes to delete")
	}

	return nil
}

type DeleteMultipleResp struct {
	Name string `json:"name"`
	Err  error  `json:"err"`
}

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
// @deprecated
// Deprecated: use endpointDeleteMultiple instead.
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

	err = handler.DataStore.UpdateTx(func(tx dataservices.DataStoreTx) error {
		return handler.deleteEndpoint(tx, portainer.EndpointID(endpointID), deleteCluster)
	})
	if err != nil {
		var handlerError *httperror.HandlerError
		if errors.As(err, &handlerError) {
			return handlerError
		}

		return httperror.InternalServerError("Unexpected error", err)
	}

	return response.Empty(w)
}

// @id EndpointDeleteMultiple
// @summary Remove multiple environment(endpoint)s
// @description Remove multiple environment(endpoint)s.
// @description **Access policy**: administrator
// @tags endpoints
// @security ApiKeyAuth
// @security jwt
// @accept json
// @produce json
// @param body body DeleteMultiplePayload true "List of endpoints to delete"
// @success 204 "Success"
// @failure 400 "Invalid request"
// @failure 403 "Permission denied"
// @failure 404 "Environment(Endpoint) not found"
// @failure 500 "Server error"
// @router /endpoints/remove [post]
func (handler *Handler) endpointDeleteMultiple(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	var p DeleteMultiplePayload
	if err := request.DecodeAndValidateJSONPayload(r, &p); err != nil {
		return httperror.BadRequest("Invalid request payload", err)
	}

	var resps []DeleteMultipleResp

	err := handler.DataStore.UpdateTx(func(tx dataservices.DataStoreTx) error {
		for _, e := range p.Endpoints {
			// Attempt deletion.
			err := handler.deleteEndpoint(
				tx,
				portainer.EndpointID(e.ID),
				e.DeleteCluster,
			)

			resps = append(resps, DeleteMultipleResp{Name: e.Name, Err: err})
		}

		return nil
	})
	if err != nil {
		return httperror.InternalServerError("Unable to delete environments", err)
	}

	return response.JSON(w, resps)
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
		var tag *portainer.Tag
		tag, err = tx.Tag().Read(tagID)
		if err == nil {
			delete(tag.Endpoints, endpoint.ID)
			err = tx.Tag().Update(tagID, tag)
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
		edgeGroup.Endpoints = slices.DeleteFunc(edgeGroup.Endpoints, func(e portainer.EndpointID) bool {
			return e == endpoint.ID
		})

		err = tx.EdgeGroup().Update(edgeGroup.ID, &edgeGroup)
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
				delete(edgeJob.Endpoints, endpoint.ID)

				err = tx.EdgeJob().Update(edgeJob.ID, edgeJob)
				if err != nil {
					log.Warn().Err(err).Msgf("Unable to update edge job")
				}
			}
		}
	}

	// delete the pending actions
	err = tx.PendingActions().DeleteByEndpointID(endpoint.ID)
	if err != nil {
		log.Warn().Err(err).Int("endpointId", int(endpoint.ID)).Msgf("Unable to delete pending actions")
	}

	err = tx.Endpoint().DeleteEndpoint(portainer.EndpointID(endpointID))
	if err != nil {
		return httperror.InternalServerError("Unable to delete the environment from the database", err)
	}

	return nil
}
