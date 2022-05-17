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

// IsEdgeEndpoint returns true if this is an Edge endpoint
func IsEdgeEndpoint(endpoint *portainer.Endpoint) bool {
	return endpoint.Type == portainer.EdgeAgentOnDockerEnvironment || endpoint.Type == portainer.EdgeAgentOnKubernetesEnvironment
}

// IsAgentEndpoint returns true if this is an Agent endpoint
func IsAgentEndpoint(endpoint *portainer.Endpoint) bool {
	return endpoint.Type == portainer.AgentOnDockerEnvironment ||
		endpoint.Type == portainer.EdgeAgentOnDockerEnvironment ||
		endpoint.Type == portainer.AgentOnKubernetesEnvironment ||
		endpoint.Type == portainer.EdgeAgentOnKubernetesEnvironment
}

// FilterByExcludeIDs receives an environment(endpoint) array and returns a filtered array using an excludeIds param
func FilterByExcludeIDs(endpoints []portainer.Endpoint, excludeIds []portainer.EndpointID) []portainer.Endpoint {
	if len(excludeIds) == 0 {
		return endpoints
	}

	filteredEndpoints := make([]portainer.Endpoint, 0)

	idsSet := make(map[portainer.EndpointID]bool)
	for _, id := range excludeIds {
		idsSet[id] = true
	}

	for _, endpoint := range endpoints {
		if !idsSet[endpoint.ID] {
			filteredEndpoints = append(filteredEndpoints, endpoint)
		}
	}
	return filteredEndpoints
}

// EndpointSet receives an environment(endpoint) array and returns a set
func EndpointSet(endpointIDs []portainer.EndpointID) map[portainer.EndpointID]bool {
	set := map[portainer.EndpointID]bool{}

	for _, endpointID := range endpointIDs {
		set[endpointID] = true
	}

	return set
}
