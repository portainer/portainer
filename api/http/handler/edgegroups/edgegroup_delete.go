package edgegroups

import (
	"errors"
	"net/http"

	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	"github.com/portainer/libhttp/response"
	portainer "github.com/portainer/portainer/api"
)

// @id EdgeGroupDelete
// @summary Deletes an EdgeGroup
// @description **Access policy**: administrator
// @tags edge_groups
// @security ApiKeyAuth
// @security jwt
// @param id path int true "EdgeGroup Id"
// @success 204
// @failure 503 "Edge compute features are disabled"
// @failure 500
// @router /edge_groups/{id} [delete]
func (handler *Handler) edgeGroupDelete(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	edgeGroupID, err := request.RetrieveNumericRouteVariableValue(r, "id")
	if err != nil {
		return httperror.BadRequest("Invalid Edge group identifier route variable", err)
	}

	_, err = handler.DataStore.EdgeGroup().EdgeGroup(portainer.EdgeGroupID(edgeGroupID))
	if handler.DataStore.IsErrObjectNotFound(err) {
		return httperror.NotFound("Unable to find an Edge group with the specified identifier inside the database", err)
	} else if err != nil {
		return httperror.InternalServerError("Unable to find an Edge group with the specified identifier inside the database", err)
	}

	edgeStacks, err := handler.DataStore.EdgeStack().EdgeStacks()
	if err != nil {
		return httperror.InternalServerError("Unable to retrieve Edge stacks from the database", err)
	}

	for _, edgeStack := range edgeStacks {
		for _, groupID := range edgeStack.EdgeGroups {
			if groupID == portainer.EdgeGroupID(edgeGroupID) {
				return httperror.NewError(http.StatusConflict, "Edge group is used by an Edge stack", errors.New("edge group is used by an Edge stack"))
			}
		}
	}

	edgeJobs, err := handler.DataStore.EdgeJob().EdgeJobs()
	if err != nil {
		return httperror.InternalServerError("Unable to retrieve Edge jobs from the database", err)
	}

	for _, edgeJob := range edgeJobs {
		for _, groupID := range edgeJob.EdgeGroups {
			if groupID == portainer.EdgeGroupID(edgeGroupID) {
				return httperror.NewError(http.StatusConflict, "Edge group is used by an Edge job", errors.New("edge group is used by an Edge job"))
			}
		}
	}

	err = handler.DataStore.EdgeGroup().DeleteEdgeGroup(portainer.EdgeGroupID(edgeGroupID))
	if err != nil {
		return httperror.InternalServerError("Unable to remove the Edge group from the database", err)
	}

	return response.Empty(w)
}
