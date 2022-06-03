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
// @success 200 {array} portainer.EdgeStack
// @failure 500
// @failure 400
// @failure 503 "Edge compute features are disabled"
// @router /edge_stacks [get]
func (handler *Handler) edgeStackList(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	edgeStacks, err := handler.DataStore.EdgeStack().EdgeStacks()
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve edge stacks from the database", err}
	}

	endpointRels, err := handler.DataStore.EndpointRelation().EndpointRelations()
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve endpoint relations from the database", err}
	}

	m := make(map[portainer.EdgeStackID]map[portainer.EndpointID]portainer.EdgeStackStatus)

	for _, r := range endpointRels {
		for edgeStackID, status := range r.EdgeStacks {
			if m[edgeStackID] == nil {
				m[edgeStackID] = make(map[portainer.EndpointID]portainer.EdgeStackStatus)
			}

			m[edgeStackID][r.EndpointID] = status
		}
	}

	type EdgeStackWithStatus struct {
		portainer.EdgeStack
		Status map[portainer.EndpointID]portainer.EdgeStackStatus
	}

	var edgeStacksWS []EdgeStackWithStatus
	for _, s := range edgeStacks {
		edgeStacksWS = append(edgeStacksWS, EdgeStackWithStatus{
			EdgeStack: s,
			Status:    m[s.ID],
		})
	}

	return response.JSON(w, edgeStacksWS)
}
