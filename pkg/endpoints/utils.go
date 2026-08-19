package endpoints

import (
	"strings"

	portainer "github.com/portainer/portainer/api"

	"github.com/Masterminds/semver/v3"
)

// IsLocalEndpoint returns true if this is a local environment(endpoint)
func IsLocalEndpoint(endpoint *portainer.Endpoint) bool {
	return strings.HasPrefix(endpoint.URL, "unix://") ||
		strings.HasPrefix(endpoint.URL, "npipe://") ||
		endpoint.Type == portainer.KubernetesLocalEnvironment
}

// IsKubernetesEndpoint returns true if this is a kubernetes environment(endpoint)
func IsKubernetesEndpoint(endpoint *portainer.Endpoint) bool {
	return endpoint.Type == portainer.KubernetesLocalEnvironment ||
		endpoint.Type == portainer.AgentOnKubernetesEnvironment ||
		endpoint.Type == portainer.EdgeAgentOnKubernetesEnvironment
}

// IsDockerEndpoint returns true if this is a docker environment(endpoint)
func IsDockerEndpoint(endpoint *portainer.Endpoint) bool {
	return endpoint.Type == portainer.DockerEnvironment ||
		endpoint.Type == portainer.AgentOnDockerEnvironment ||
		endpoint.Type == portainer.EdgeAgentOnDockerEnvironment
}

// IsAgentEndpoint returns true if this is an Agent endpoint
func IsAgentEndpoint(endpoint *portainer.Endpoint) bool {
	return endpoint.Type == portainer.AgentOnDockerEnvironment ||
		endpoint.Type == portainer.EdgeAgentOnDockerEnvironment ||
		endpoint.Type == portainer.AgentOnKubernetesEnvironment ||
		endpoint.Type == portainer.EdgeAgentOnKubernetesEnvironment
}

// EndpointSet receives an environment(endpoint) array and returns a set
func EndpointSet(endpointIDs []portainer.EndpointID) map[portainer.EndpointID]bool {
	set := map[portainer.EndpointID]bool{}

	for _, endpointID := range endpointIDs {
		set[endpointID] = true
	}

	return set
}

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
	v1, err := semver.NewVersion(agentVersion)
	if err != nil || v1 == nil {
		return false
	}

	v2, err := semver.NewVersion("2.25.0")
	if err != nil || v2 == nil {
		return false
	}

	return v1.GreaterThanEqual(v2)
}
