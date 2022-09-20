package edgestacks

import (
	"net/http"

	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/response"
	portainer "github.com/portainer/portainer/api"
)

// @id EdgeStackList
// @summary Fetches the list of EdgeStacks
// @description **Access policy**: administrator
// @tags edge_stacks
// @security ApiKeyAuth
// @security jwt
// @produce json
// @success 200 {array} decoratedEdgeStack
// @failure 500
// @failure 400
// @failure 503 "Edge compute features are disabled"
// @router /edge_stacks [get]
func (handler *Handler) edgeStackList(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	edgeStacks, err := handler.DataStore.EdgeStack().EdgeStacks()
	if err != nil {
		return httperror.InternalServerError("Unable to retrieve edge stacks from the database", err)
	}

	schedules, err := handler.DataStore.EdgeUpdateSchedule().List()
	if err != nil {
		return httperror.InternalServerError("Unable to retrieve edge update schedules from the database", err)
	}

	hasSchedule := map[portainer.EdgeStackID]bool{}
	for _, schedule := range schedules {
		hasSchedule[schedule.EdgeStackID] = true
	}

	filteredEdgeStacks := []portainer.EdgeStack{}
	for _, edgeStack := range edgeStacks {
		if !hasSchedule[edgeStack.ID] {
			filteredEdgeStacks = append(filteredEdgeStacks, edgeStack)
		}
	}

	return response.JSON(w, filteredEdgeStacks)
}
