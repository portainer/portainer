package tags

import (
	"net/http"
	"slices"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	"github.com/portainer/portainer/api/internal/edge"
	"github.com/portainer/portainer/api/internal/endpointutils"
	httperror "github.com/portainer/portainer/pkg/libhttp/error"
	"github.com/portainer/portainer/pkg/libhttp/request"
	"github.com/portainer/portainer/pkg/libhttp/response"
)

// @id TagDelete
// @summary Remove a tag
// @description Remove a tag.
// @description **Access policy**: administrator
// @tags tags
// @security ApiKeyAuth
// @security jwt
// @param id path int true "Tag identifier"
// @success 204 "Success"
// @failure 400 "Invalid request"
// @failure 403 "Permission denied"
// @failure 404 "Tag not found"
// @failure 500 "Server error"
// @router /tags/{id} [delete]
func (handler *Handler) tagDelete(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	id, err := request.RetrieveNumericRouteVariableValue(r, "id")
	if err != nil {
		return httperror.BadRequest("Invalid tag identifier route variable", err)
	}

	err = handler.DataStore.UpdateTx(func(tx dataservices.DataStoreTx) error {
		return deleteTag(tx, portainer.TagID(id))
	})

	return response.TxEmptyResponse(w, err)
}

func deleteTag(tx dataservices.DataStoreTx, tagID portainer.TagID) error {
	tag, err := tx.Tag().Read(tagID)
	if tx.IsErrObjectNotFound(err) {
		return httperror.NotFound("Unable to find a tag with the specified identifier inside the database", err)
	} else if err != nil {
		return httperror.InternalServerError("Unable to find a tag with the specified identifier inside the database", err)
	}

	for endpointID := range tag.Endpoints {
		endpoint, err := tx.Endpoint().Endpoint(endpointID)
		if tx.IsErrObjectNotFound(err) {
			continue
		}
		if err != nil {
			return httperror.InternalServerError("Unable to retrieve environment from the database", err)
		}

		endpoint.TagIDs = slices.DeleteFunc(endpoint.TagIDs, func(t portainer.TagID) bool {
			return t == tagID
		})

		err = tx.Endpoint().UpdateEndpoint(endpoint.ID, endpoint)
		if err != nil {
			return httperror.InternalServerError("Unable to update environment", err)
		}
	}

	for endpointGroupID := range tag.EndpointGroups {
		endpointGroup, err := tx.EndpointGroup().Read(endpointGroupID)
		if err != nil {
			return httperror.InternalServerError("Unable to retrieve environment group from the database", err)
		}

		endpointGroup.TagIDs = slices.DeleteFunc(endpointGroup.TagIDs, func(t portainer.TagID) bool {
			return t == tagID
		})

		err = tx.EndpointGroup().Update(endpointGroup.ID, endpointGroup)
		if err != nil {
			return httperror.InternalServerError("Unable to update environment group", err)
		}
	}

	endpoints, err := tx.Endpoint().Endpoints()
	if err != nil {
		return httperror.InternalServerError("Unable to retrieve environments from the database", err)
	}

	edgeGroups, err := tx.EdgeGroup().ReadAll()
	if err != nil {
		return httperror.InternalServerError("Unable to retrieve edge groups from the database", err)
	}

	edgeStacks, err := tx.EdgeStack().EdgeStacks()
	if err != nil {
		return httperror.InternalServerError("Unable to retrieve edge stacks from the database", err)
	}

	edgeJobs, err := tx.EdgeJob().ReadAll()
	if err != nil {
		return httperror.InternalServerError("Unable to retrieve edge job configurations from the database", err)
	}
	for _, edgeGroup := range edgeGroups {
		edgeGroup.TagIDs = slices.DeleteFunc(edgeGroup.TagIDs, func(t portainer.TagID) bool {
			return t == tagID
		})

		err = tx.EdgeGroup().Update(edgeGroup.ID, &edgeGroup)
		if err != nil {
			return httperror.InternalServerError("Unable to update edge group", err)
		}
	}

	for _, endpoint := range endpoints {
		if (!tag.Endpoints[endpoint.ID] && !tag.EndpointGroups[endpoint.GroupID]) || !endpointutils.IsEdgeEndpoint(&endpoint) {
			continue
		}

		if err := updateEndpointRelations(tx, endpoint, edgeGroups, edgeStacks, edgeJobs); err != nil {
			return httperror.InternalServerError("Unable to update environment relations in the database", err)
		}
	}

	err = tx.Tag().Delete(tagID)
	if err != nil {
		return httperror.InternalServerError("Unable to remove the tag from the database", err)
	}

	return nil
}

func updateEndpointRelations(tx dataservices.DataStoreTx, endpoint portainer.Endpoint, edgeGroups []portainer.EdgeGroup, edgeStacks []portainer.EdgeStack, edgeJobs []portainer.EdgeJob) error {
	endpointRelation, err := tx.EndpointRelation().EndpointRelation(endpoint.ID)
	if err != nil {
		return err
	}

	endpointGroup, err := tx.EndpointGroup().Read(endpoint.GroupID)
	if err != nil {
		return err
	}

	endpointStacks := edge.EndpointRelatedEdgeStacks(&endpoint, endpointGroup, edgeGroups, edgeStacks)
	stacksSet := map[portainer.EdgeStackID]bool{}
	for _, edgeStackID := range endpointStacks {
		stacksSet[edgeStackID] = true
	}

	endpointRelation.EdgeStacks = stacksSet

	if err := tx.EndpointRelation().UpdateEndpointRelation(endpoint.ID, endpointRelation); err != nil {
		return err
	}

	for _, edgeJob := range edgeJobs {
		endpoints, err := edge.GetEndpointsFromEdgeGroups(edgeJob.EdgeGroups, tx)
		if err != nil {
			return err
		}
		if slices.Contains(endpoints, endpoint.ID) {
			continue
		}

		delete(edgeJob.GroupLogsCollection, endpoint.ID)

		if err := tx.EdgeJob().Update(edgeJob.ID, &edgeJob); err != nil {
			return err
		}
	}

	return nil
}
