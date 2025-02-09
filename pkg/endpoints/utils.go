package endpoints

import (
	"github.com/hashicorp/go-version"
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

// IsStandardEdgeEndpoint returns true if this is a standard Edge endpoint and not in async mode on either Docker or Kubernetes
func IsStandardEdgeEndpoint(endpoint *portainer.Endpoint) bool {
	return (endpoint.Type == portainer.EdgeAgentOnDockerEnvironment || endpoint.Type == portainer.EdgeAgentOnKubernetesEnvironment) && !endpoint.Edge.AsyncMode
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

// IsNewerThan225 returns true if the agent version is newer than 2.25.0
// this is used to check if the agent is compatible with the new diagnostics feature
func IsNewerThan225(agentVersion string) bool {
	v1, _ := version.NewVersion(agentVersion)
	v2, _ := version.NewVersion("2.25.0")
	return v1.GreaterThanOrEqual(v2)
}
