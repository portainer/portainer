package status

import (
	portainer "github.com/portainer/portainer/api"
)

// NodesCount returns the total node number of all environments
func NodesCount(endpoints []portainer.Endpoint) int {
	nodes := 0
	for _, env := range endpoints {
		nodes += countNodes(&env)
	}

	return nodes
}

func countNodes(endpoint *portainer.Endpoint) int {
	if len(endpoint.Snapshots) == 1 {
		return max(endpoint.Snapshots[0].NodeCount, 1)
	}

	if len(endpoint.Kubernetes.Snapshots) == 1 {
		return max(endpoint.Kubernetes.Snapshots[0].NodeCount, 1)
	}

	return 1
}

func max(a, b int) int {
	if a > b {
		return a
	}

	return b
}
