package edgestacks

import (
	"net/http"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	httperror "github.com/portainer/portainer/pkg/libhttp/error"
	"github.com/portainer/portainer/pkg/libhttp/request"
	"github.com/portainer/portainer/pkg/libhttp/response"
)

// @id EdgeStackInspect
// @summary Inspect an EdgeStack
// @description **Access policy**: administrator
// @tags edge_stacks
// @security ApiKeyAuth
// @security jwt
// @produce json
// @param id path int true "EdgeStack Id"
// @success 200 {object} portainer.EdgeStack
// @failure 500
// @failure 400
// @failure 503 "Edge compute features are disabled"
// @router /edge_stacks/{id} [get]
func (handler *Handler) edgeStackInspect(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	edgeStackID, err := request.RetrieveNumericRouteVariableValue(r, "id")
	if err != nil {
		return httperror.BadRequest("Invalid edge stack identifier route variable", err)
	}

	edgeStack, err := handler.DataStore.EdgeStack().EdgeStack(portainer.EdgeStackID(edgeStackID))
	if err != nil {
		return handlerDBErr(err, "Unable to find an edge stack with the specified identifier inside the database")
	}

	if err := fillEdgeStackStatus(handler.DataStore, edgeStack); err != nil {
		return handlerDBErr(err, "Unable to retrieve edge stack status from the database")
	}

	return response.JSON(w, edgeStack)
}

func fillEdgeStackStatus(tx dataservices.DataStoreTx, edgeStack *portainer.EdgeStack) error {
	status, err := tx.EdgeStackStatus().ReadAll(edgeStack.ID)
	if err != nil {
		return err
	}

	edgeStack.Status = make(map[portainer.EndpointID]portainer.EdgeStackStatus, len(status))

	emptyStatus := make([]portainer.EdgeStackDeploymentStatus, 0)

	for _, s := range status {
		if s.Status == nil {
			s.Status = emptyStatus
		}

		edgeStack.Status[s.EndpointID] = portainer.EdgeStackStatus{
			Status:           s.Status,
			EndpointID:       s.EndpointID,
			DeploymentInfo:   s.DeploymentInfo,
			ReadyRePullImage: s.ReadyRePullImage,
		}
	}

	return nil
}
