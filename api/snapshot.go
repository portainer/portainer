package portainer

// EndpointSupportsSnapshot returns true for an endpoint where snapshot are supported.
func EndpointSupportsSnapshot(endpoint *Endpoint) bool {
	if endpoint.Type == DockerEnvironment || endpoint.Type == AgentOnDockerEnvironment {
		return true
	}

	return false
}
