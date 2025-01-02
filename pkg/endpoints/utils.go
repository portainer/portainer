package endpoints

import (
	portainer "github.com/portainer/portainer/api"
)

// IsRegularAgentEndpoint returns true if this is a regular agent endpoint
func IsRegularAgentEndpoint(endpoint *portainer.Endpoint) bool {
	return endpoint.Type == portainer.AgentOnDockerEnvironment ||
		endpoint.Type == portainer.AgentOnKubernetesEnvironment
}

// IsEdgeEndpoint returns true if this is an Edge endpoint
func IsEdgeEndpoint(endpoint *portainer.Endpoint) bool {
	return endpoint.Type == portainer.EdgeAgentOnDockerEnvironment || endpoint.Type == portainer.EdgeAgentOnKubernetesEnvironment
}

// IsAssociatedEdgeEndpoint returns true if the environment is an Edge environment
// and has a set EdgeID and UserTrusted is true.
func IsAssociatedEdgeEndpoint(endpoint *portainer.Endpoint) bool {
	return IsEdgeEndpoint(endpoint) && endpoint.EdgeID != "" && endpoint.UserTrusted
}

// HasDirectConnectivity returns true if the environment is a non-Edge environment
// or is an associated Edge environment that is not in async mode.
func HasDirectConnectivity(endpoint *portainer.Endpoint) bool {
	return !IsEdgeEndpoint(endpoint) || (IsAssociatedEdgeEndpoint(endpoint) && !endpoint.Edge.AsyncMode)
}
