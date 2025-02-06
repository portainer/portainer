package endpoints

import (
	"errors"
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

type endpointDeleteRequest struct {
	ID            int  `json:"id"`
	DeleteCluster bool `json:"deleteCluster"`
}

type endpointDeleteBatchPayload struct {
	Endpoints []endpointDeleteRequest `json:"endpoints"`
}

type endpointDeleteBatchPartialResponse struct {
	Deleted []int `json:"deleted"`
	Errors  []int `json:"errors"`
}

func (payload *endpointDeleteBatchPayload) Validate(r *http.Request) error {
	if payload == nil || len(payload.Endpoints) == 0 {
		return errors.New("invalid request payload. You must provide a list of environments to delete")
	}

	return nil
}

// @id EndpointDelete
// @summary Remove an environment
// @description Remove the environment associated to the specified identifier and optionally clean-up associated resources.
// @description **Access policy**: Administrator only.
// @tags endpoints
// @security ApiKeyAuth || jwt
// @param id path int true "Environment(Endpoint) identifier"
// @success 204 "Environment successfully deleted."
// @failure 400 "Invalid request payload, such as missing required fields or fields not meeting validation criteria."
// @failure 403 "Unauthorized access or operation not allowed."
// @failure 404 "Unable to find the environment with the specified identifier inside the database."
// @failure 500 "Server error occurred while attempting to delete the environment."
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

	if err := handler.DataStore.UpdateTx(func(tx dataservices.DataStoreTx) error {
		return handler.deleteEndpoint(tx, portainer.EndpointID(endpointID), deleteCluster)
	}); err != nil {
		var handlerError *httperror.HandlerError
		if errors.As(err, &handlerError) {
			return handlerError
		}

		return httperror.InternalServerError("Unexpected error", err)
	}

	return response.Empty(w)
}

// @id EndpointDeleteBatch
// @summary Remove multiple environments
// @description Remove multiple environments and optionally clean-up associated resources.
// @description **Access policy**: Administrator only.
// @tags endpoints
// @security ApiKeyAuth || jwt
// @accept json
// @produce json
// @param body body endpointDeleteBatchPayload true "List of environments to delete, with optional deleteCluster flag to clean-up associated resources (cloud environments only)"
// @success 204 "Environment(s) successfully deleted."
// @failure 207 {object} endpointDeleteBatchPartialResponse "Partial success. Some environments were deleted successfully, while others failed."
// @failure 400 "Invalid request payload, such as missing required fields or fields not meeting validation criteria."
// @failure 403 "Unauthorized access or operation not allowed."
// @failure 500 "Server error occurred while attempting to delete the specified environments."
// @router /endpoints/delete [post]
func (handler *Handler) endpointDeleteBatch(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	var p endpointDeleteBatchPayload
	if err := request.DecodeAndValidateJSONPayload(r, &p); err != nil {
		return httperror.BadRequest("Invalid request payload", err)
	}

	resp := endpointDeleteBatchPartialResponse{
		Deleted: []int{},
		Errors:  []int{},
	}

	if err := handler.DataStore.UpdateTx(func(tx dataservices.DataStoreTx) error {
		for _, e := range p.Endpoints {
			if err := handler.deleteEndpoint(tx, portainer.EndpointID(e.ID), e.DeleteCluster); err != nil {
				resp.Errors = append(resp.Errors, e.ID)
				log.Warn().Err(err).Int("environment_id", e.ID).Msg("Unable to remove environment")

				continue
			}

			resp.Deleted = append(resp.Deleted, e.ID)
		}

		return nil
	}); err != nil {
		return httperror.InternalServerError("Unable to delete environments", err)
	}

	if len(resp.Errors) > 0 {
		return response.JSONWithStatus(w, resp, http.StatusPartialContent)
	}

	return response.Empty(w)
}

// @id EndpointDeleteBatchDeprecated
// @summary Remove multiple environments
// @deprecated
// @description Deprecated: use the `POST` endpoint instead.
// @description Remove multiple environments and optionally clean-up associated resources.
// @description **Access policy**: Administrator only.
// @tags endpoints
// @security ApiKeyAuth || jwt
// @accept json
// @produce json
// @param body body endpointDeleteBatchPayload true "List of environments to delete, with optional deleteCluster flag to clean-up associated resources (cloud environments only)"
// @success 204 "Environment(s) successfully deleted."
// @failure 207 {object} endpointDeleteBatchPartialResponse "Partial success. Some environments were deleted successfully, while others failed."
// @failure 400 "Invalid request payload, such as missing required fields or fields not meeting validation criteria."
// @failure 403 "Unauthorized access or operation not allowed."
// @failure 500 "Server error occurred while attempting to delete the specified environments."
// @router /endpoints [delete]
func (handler *Handler) endpointDeleteBatchDeprecated(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	return handler.endpointDeleteBatch(w, r)
}

func (handler *Handler) deleteEndpoint(tx dataservices.DataStoreTx, endpointID portainer.EndpointID, deleteCluster bool) error {
	endpoint, err := tx.Endpoint().Endpoint(endpointID)
	if tx.IsErrObjectNotFound(err) {
		return httperror.NotFound("Unable to find an environment with the specified identifier inside the database", err)
	} else if err != nil {
		return httperror.InternalServerError("Unable to read the environment record from the database", err)
	}

	if endpoint.TLSConfig.TLS {
		folder := strconv.Itoa(int(endpointID))
		if err := handler.FileService.DeleteTLSFiles(folder); err != nil {
			log.Error().Err(err).Msgf("Unable to remove TLS files from disk when deleting endpoint %d", endpointID)
		}
	}

	if err := tx.Snapshot().Delete(endpointID); err != nil {
		log.Warn().Err(err).Msg("Unable to remove the snapshot from the database")
	}

	handler.ProxyManager.DeleteEndpointProxy(endpoint.ID)

	if len(endpoint.UserAccessPolicies) > 0 || len(endpoint.TeamAccessPolicies) > 0 {
		if err := handler.AuthorizationService.UpdateUsersAuthorizationsTx(tx); err != nil {
			log.Warn().Err(err).Msg("Unable to update user authorizations")
		}
	}

	if err := tx.EndpointRelation().DeleteEndpointRelation(endpoint.ID); err != nil {
		log.Warn().Err(err).Msg("Unable to remove environment relation from the database")
	}

	for _, tagID := range endpoint.TagIDs {
		var tag *portainer.Tag
		tag, err = tx.Tag().Read(tagID)
		if err == nil {
			delete(tag.Endpoints, endpoint.ID)
			err = tx.Tag().Update(tagID, tag)
		}

		if handler.DataStore.IsErrObjectNotFound(err) {
			log.Warn().Err(err).Msg("Unable to find tag inside the database")
		} else if err != nil {
			log.Warn().Err(err).Msg("Unable to delete tag relation from the database")
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

		if err := tx.EdgeGroup().Update(edgeGroup.ID, &edgeGroup); err != nil {
			log.Warn().Err(err).Msg("Unable to update edge group")
		}
	}

	edgeStacks, err := tx.EdgeStack().EdgeStacks()
	if err != nil {
		log.Warn().Err(err).Msg("Unable to retrieve edge stacks from the database")
	}

	for idx := range edgeStacks {
		edgeStack := &edgeStacks[idx]
		if _, ok := edgeStack.Status[endpoint.ID]; ok {
			delete(edgeStack.Status, endpoint.ID)

			if err := tx.EdgeStack().UpdateEdgeStack(edgeStack.ID, edgeStack); err != nil {
				log.Warn().Err(err).Msg("Unable to update edge stack")
			}
		}
	}

	registries, err := tx.Registry().ReadAll()
	if err != nil {
		log.Warn().Err(err).Msg("Unable to retrieve registries from the database")
	}

	for idx := range registries {
		registry := &registries[idx]
		if _, ok := registry.RegistryAccesses[endpoint.ID]; ok {
			delete(registry.RegistryAccesses, endpoint.ID)

			if err := tx.Registry().Update(registry.ID, registry); err != nil {
				log.Warn().Err(err).Msg("Unable to update registry accesses")
			}
		}
	}

	if endpointutils.IsEdgeEndpoint(endpoint) {
		edgeJobs, err := handler.DataStore.EdgeJob().ReadAll()
		if err != nil {
			log.Warn().Err(err).Msg("Unable to retrieve edge jobs from the database")
		}

		for idx := range edgeJobs {
			edgeJob := &edgeJobs[idx]
			if _, ok := edgeJob.Endpoints[endpoint.ID]; ok {
				delete(edgeJob.Endpoints, endpoint.ID)

				if err := tx.EdgeJob().Update(edgeJob.ID, edgeJob); err != nil {
					log.Warn().Err(err).Msg("Unable to update edge job")
				}
			}
		}
	}

	// delete the pending actions
	if err := tx.PendingActions().DeleteByEndpointID(endpoint.ID); err != nil {
		log.Warn().Err(err).Int("endpointId", int(endpoint.ID)).Msg("Unable to delete pending actions")
	}

	if err := tx.Endpoint().DeleteEndpoint(endpointID); err != nil {
		return httperror.InternalServerError("Unable to delete the environment from the database", err)
	}

	return nil
}
