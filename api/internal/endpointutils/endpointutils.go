package endpointutils

import (
	"strings"

	portainer "github.com/portainer/portainer/api"
)

// IsLocalEndpoint returns true if this is a local environment(endpoint)
func IsLocalEndpoint(endpoint *portainer.Endpoint) bool {
	return strings.HasPrefix(endpoint.URL, "unix://") || strings.HasPrefix(endpoint.URL, "npipe://") || endpoint.Type == 5
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
