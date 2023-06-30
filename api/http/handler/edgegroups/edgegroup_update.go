package edgegroups

import (
	"errors"
	"net/http"

	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	"github.com/portainer/portainer/api/internal/edge"
	"github.com/portainer/portainer/api/internal/endpointutils"
	"github.com/portainer/portainer/api/internal/slices"
	"github.com/portainer/portainer/api/internal/unique"

	"github.com/asaskevich/govalidator"
)

type edgeGroupUpdatePayload struct {
	Name         string
	Dynamic      bool
	TagIDs       []portainer.TagID
	Endpoints    []portainer.EndpointID
	PartialMatch *bool
}

func (payload *edgeGroupUpdatePayload) Validate(r *http.Request) error {
	if govalidator.IsNull(payload.Name) {
		return errors.New("invalid Edge group name")
	}

	if payload.Dynamic && len(payload.TagIDs) == 0 {
		return errors.New("tagIDs is mandatory for a dynamic Edge group")
	}

	return nil
}

// @id EgeGroupUpdate
// @summary Updates an EdgeGroup
// @description **Access policy**: administrator
// @tags edge_groups
// @security ApiKeyAuth
// @security jwt
// @accept json
// @produce json
// @param id path int true "EdgeGroup Id"
// @param body body edgeGroupUpdatePayload true "EdgeGroup data"
// @success 200 {object} portainer.EdgeGroup
// @failure 503 "Edge compute features are disabled"
// @failure 500
// @router /edge_groups/{id} [put]
func (handler *Handler) edgeGroupUpdate(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	edgeGroupID, err := request.RetrieveNumericRouteVariableValue(r, "id")
	if err != nil {
		return httperror.BadRequest("Invalid Edge group identifier route variable", err)
	}

	var payload edgeGroupUpdatePayload
	err = request.DecodeAndValidateJSONPayload(r, &payload)
	if err != nil {
		return httperror.BadRequest("Invalid request payload", err)
	}

	var edgeGroup *portainer.EdgeGroup
	err = handler.DataStore.UpdateTx(func(tx dataservices.DataStoreTx) error {
		edgeGroup, err = tx.EdgeGroup().Read(portainer.EdgeGroupID(edgeGroupID))
		if handler.DataStore.IsErrObjectNotFound(err) {
			return httperror.NotFound("Unable to find an Edge group with the specified identifier inside the database", err)
		} else if err != nil {
			return httperror.InternalServerError("Unable to find an Edge group with the specified identifier inside the database", err)
		}

		if payload.Name != "" {
			edgeGroups, err := tx.EdgeGroup().ReadAll()
			if err != nil {
				return httperror.InternalServerError("Unable to retrieve Edge groups from the database", err)
			}

			for _, edgeGroup := range edgeGroups {
				if edgeGroup.Name == payload.Name && edgeGroup.ID != portainer.EdgeGroupID(edgeGroupID) {
					return httperror.BadRequest("Edge group name must be unique", errors.New("edge group name must be unique"))
				}
			}

			edgeGroup.Name = payload.Name
		}

		endpoints, err := tx.Endpoint().Endpoints()
		if err != nil {
			return httperror.InternalServerError("Unable to retrieve environments from database", err)
		}

		endpointGroups, err := tx.EndpointGroup().ReadAll()
		if err != nil {
			return httperror.InternalServerError("Unable to retrieve environment groups from database", err)
		}

		oldRelatedEndpoints := edge.EdgeGroupRelatedEndpoints(edgeGroup, endpoints, endpointGroups)

		edgeGroup.Dynamic = payload.Dynamic
		if edgeGroup.Dynamic {
			edgeGroup.TagIDs = payload.TagIDs
		} else {
			endpointIDs := []portainer.EndpointID{}
			for _, endpointID := range payload.Endpoints {
				endpoint, err := tx.Endpoint().Endpoint(endpointID)
				if err != nil {
					return httperror.InternalServerError("Unable to retrieve environment from the database", err)
				}

				if endpointutils.IsEdgeEndpoint(endpoint) {
					endpointIDs = append(endpointIDs, endpoint.ID)
				}
			}
			edgeGroup.Endpoints = endpointIDs
		}

		if payload.PartialMatch != nil {
			edgeGroup.PartialMatch = *payload.PartialMatch
		}

		err = tx.EdgeGroup().Update(edgeGroup.ID, edgeGroup)
		if err != nil {
			return httperror.InternalServerError("Unable to persist Edge group changes inside the database", err)
		}

		newRelatedEndpoints := edge.EdgeGroupRelatedEndpoints(edgeGroup, endpoints, endpointGroups)
		endpointsToUpdate := unique.Unique(append(newRelatedEndpoints, oldRelatedEndpoints...))

		edgeJobs, err := tx.EdgeJob().ReadAll()
		if err != nil {
			return httperror.InternalServerError("Unable to fetch Edge jobs", err)
		}

		for _, endpointID := range endpointsToUpdate {
			err = handler.updateEndpointStacks(tx, endpointID)
			if err != nil {
				return httperror.InternalServerError("Unable to persist Environment relation changes inside the database", err)
			}

			endpoint, err := tx.Endpoint().Endpoint(endpointID)
			if err != nil {
				return httperror.InternalServerError("Unable to get Environment from database", err)
			}

			if !endpointutils.IsEdgeEndpoint(endpoint) {
				continue
			}

			var operation string
			if slices.Contains(newRelatedEndpoints, endpointID) {
				operation = "add"
			} else if slices.Contains(oldRelatedEndpoints, endpointID) {
				operation = "remove"
			} else {
				continue
			}

			err = handler.updateEndpointEdgeJobs(edgeGroup.ID, endpoint, edgeJobs, operation)
			if err != nil {
				return httperror.InternalServerError("Unable to persist Environment Edge Jobs changes inside the database", err)
			}
		}

		return nil
	})

	return txResponse(w, edgeGroup, err)
}

func (handler *Handler) updateEndpointStacks(tx dataservices.DataStoreTx, endpointID portainer.EndpointID) error {
	relation, err := tx.EndpointRelation().EndpointRelation(endpointID)
	if err != nil {
		return err
	}

	endpoint, err := tx.Endpoint().Endpoint(endpointID)
	if err != nil {
		return err
	}

	endpointGroup, err := tx.EndpointGroup().Read(endpoint.GroupID)
	if err != nil {
		return err
	}

	edgeGroups, err := tx.EdgeGroup().ReadAll()
	if err != nil {
		return err
	}

	edgeStacks, err := tx.EdgeStack().EdgeStacks()
	if err != nil {
		return err
	}

	edgeStackSet := map[portainer.EdgeStackID]bool{}

	endpointEdgeStacks := edge.EndpointRelatedEdgeStacks(endpoint, endpointGroup, edgeGroups, edgeStacks)
	for _, edgeStackID := range endpointEdgeStacks {
		edgeStackSet[edgeStackID] = true
	}

	relation.EdgeStacks = edgeStackSet

	return tx.EndpointRelation().UpdateEndpointRelation(endpoint.ID, relation)
}

func (handler *Handler) updateEndpointEdgeJobs(edgeGroupID portainer.EdgeGroupID, endpoint *portainer.Endpoint, edgeJobs []portainer.EdgeJob, operation string) error {
	for _, edgeJob := range edgeJobs {
		if !slices.Contains(edgeJob.EdgeGroups, edgeGroupID) {
			continue
		}

		switch operation {
		case "add":
			handler.ReverseTunnelService.AddEdgeJob(endpoint, &edgeJob)
		case "remove":
			handler.ReverseTunnelService.RemoveEdgeJobFromEndpoint(endpoint.ID, edgeJob.ID)
		}
	}

	return nil
}
