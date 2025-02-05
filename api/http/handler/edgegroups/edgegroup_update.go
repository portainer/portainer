package edgegroups

import (
	"errors"
	"net/http"
	"slices"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	"github.com/portainer/portainer/api/internal/edge"
	"github.com/portainer/portainer/api/internal/edge/cache"
	"github.com/portainer/portainer/api/internal/endpointutils"
	"github.com/portainer/portainer/api/slicesx"
	httperror "github.com/portainer/portainer/pkg/libhttp/error"
	"github.com/portainer/portainer/pkg/libhttp/request"
)

type edgeGroupUpdatePayload struct {
	Name         string
	Dynamic      bool
	TagIDs       []portainer.TagID
	Endpoints    []portainer.EndpointID
	PartialMatch *bool
}

func (payload *edgeGroupUpdatePayload) Validate(r *http.Request) error {
	if len(payload.Name) == 0 {
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
	if err := request.DecodeAndValidateJSONPayload(r, &payload); err != nil {
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

		edgeGroups, err := tx.EdgeGroup().ReadAll()
		if err != nil {
			return httperror.InternalServerError("Unable to retrieve Edge groups from the database", err)
		}

		if payload.Name != "" {
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
		if err := calculateEndpointsOrTags(tx, edgeGroup, payload.Endpoints, payload.TagIDs); err != nil {
			return err
		}

		if payload.PartialMatch != nil {
			edgeGroup.PartialMatch = *payload.PartialMatch
		}

		if err := tx.EdgeGroup().Update(edgeGroup.ID, edgeGroup); err != nil {
			return httperror.InternalServerError("Unable to persist Edge group changes inside the database", err)
		}

		newRelatedEndpoints := edge.EdgeGroupRelatedEndpoints(edgeGroup, endpoints, endpointGroups)
		endpointsToUpdate := slicesx.Unique(append(newRelatedEndpoints, oldRelatedEndpoints...))

		edgeJobs, err := tx.EdgeJob().ReadAll()
		if err != nil {
			return httperror.InternalServerError("Unable to fetch Edge jobs", err)
		}

		edgeStacks, err := tx.EdgeStack().EdgeStacks()
		if err != nil {
			return err
		}

		// Update the edgeGroups with the modified edgeGroup for updateEndpointStacks()
		for i := range edgeGroups {
			if edgeGroups[i].ID == edgeGroup.ID {
				edgeGroups[i] = *edgeGroup
			}
		}

		for _, endpointID := range endpointsToUpdate {
			endpoint, err := tx.Endpoint().Endpoint(endpointID)
			if err != nil {
				return httperror.InternalServerError("Unable to get Environment from database", err)
			}

			if err := handler.updateEndpointStacks(tx, endpoint, edgeGroups, edgeStacks); err != nil {
				return httperror.InternalServerError("Unable to persist Environment relation changes inside the database", err)
			}

			if !endpointutils.IsEdgeEndpoint(endpoint) {
				continue
			}

			var operation string
			if slices.Contains(newRelatedEndpoints, endpointID) && slices.Contains(oldRelatedEndpoints, endpointID) {
				continue
			} else if slices.Contains(newRelatedEndpoints, endpointID) {
				operation = "add"
			} else if slices.Contains(oldRelatedEndpoints, endpointID) {
				operation = "remove"
			} else {
				continue
			}

			if err := handler.updateEndpointEdgeJobs(edgeGroup.ID, endpoint, edgeJobs, operation); err != nil {
				return httperror.InternalServerError("Unable to persist Environment Edge Jobs changes inside the database", err)
			}
		}

		return nil
	})

	return txResponse(w, edgeGroup, err)
}

func (handler *Handler) updateEndpointStacks(tx dataservices.DataStoreTx, endpoint *portainer.Endpoint, edgeGroups []portainer.EdgeGroup, edgeStacks []portainer.EdgeStack) error {
	relation, err := tx.EndpointRelation().EndpointRelation(endpoint.ID)
	if err != nil && !handler.DataStore.IsErrObjectNotFound(err) {
		return err
	}

	endpointGroup, err := tx.EndpointGroup().Read(endpoint.GroupID)
	if err != nil {
		return err
	}

	edgeStackSet := map[portainer.EdgeStackID]bool{}

	endpointEdgeStacks := edge.EndpointRelatedEdgeStacks(endpoint, endpointGroup, edgeGroups, edgeStacks)
	for _, edgeStackID := range endpointEdgeStacks {
		edgeStackSet[edgeStackID] = true
	}

	if relation == nil {
		relation = &portainer.EndpointRelation{
			EndpointID: endpoint.ID,
			EdgeStacks: make(map[portainer.EdgeStackID]bool),
		}
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
		case "add", "remove":
			cache.Del(endpoint.ID)
		}
	}

	return nil
}
