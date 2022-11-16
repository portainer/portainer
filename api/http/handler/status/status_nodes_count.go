package status

import (
	"net/http"

	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/response"
	statusutil "github.com/portainer/portainer/api/internal/nodes"
	"github.com/portainer/portainer/api/internal/snapshot"
)

type nodesCountResponse struct {
	Nodes int `json:"nodes"`
}

// @id statusNodesCount
// @summary Retrieve the count of nodes
// @description **Access policy**: authenticated
// @security ApiKeyAuth
// @security jwt
// @tags status
// @produce json
// @success 200 {object} nodesCountResponse "Success"
// @failure 500 "Server error"
// @router /status/nodes [get]
func (handler *Handler) statusNodesCount(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	endpoints, err := handler.dataStore.Endpoint().Endpoints()
	if err != nil {
		return httperror.InternalServerError("Failed to get environment list", err)
	}

	for i := range endpoints {
		err = snapshot.FillSnapshotData(handler.dataStore, &endpoints[i])
		if err != nil {
			return httperror.InternalServerError("Unable to add snapshot data", err)
		}
	}

	nodes := statusutil.NodesCount(endpoints)

	return response.JSON(w, &nodesCountResponse{Nodes: nodes})
}
