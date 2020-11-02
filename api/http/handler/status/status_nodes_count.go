package status

import (
	"net/http"

	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/response"
	"github.com/portainer/portainer/api"
)

type nodesCountResponse struct {
	Nodes int `json:"nodes"`
}

// GET request on /api/status
func (handler *Handler) statusNodesCount(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	endpoints, err := handler.DataStore.Endpoint().Endpoints()
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Failed to get endpoint list", err}
	}

	nodes := 0
	for _, endpoint := range endpoints {
		nodes += countNodes(&endpoint)
	}

	return response.JSON(w, &nodesCountResponse{Nodes: nodes})
}

func countNodes(endpoint *portainer.Endpoint) int {
	switch endpoint.Type {
	case portainer.EdgeAgentOnDockerEnvironment, portainer.DockerEnvironment, portainer.AgentOnDockerEnvironment:
		return countDockerNodes(endpoint)
	case portainer.EdgeAgentOnKubernetesEnvironment, portainer.KubernetesLocalEnvironment, portainer.AgentOnKubernetesEnvironment:
		return countKubernetesNodes(endpoint)
	case portainer.AzureEnvironment:
		return 0
	}
	return 0
}

func countDockerNodes(endpoint *portainer.Endpoint) int {
	snapshots := endpoint.Snapshots
	if len(snapshots) == 0 {
		return 0
	}

	snapshot := snapshots[len(snapshots)-1]
	return snapshot.NodeCount
}

func countKubernetesNodes(endpoint *portainer.Endpoint) int {
	snapshots := endpoint.Kubernetes.Snapshots
	if len(snapshots) == 0 {
		return 0
	}

	snapshot := snapshots[len(snapshots)-1]
	return snapshot.NodeCount
}
