package bolt

import "github.com/portainer/portainer"

func (m *Migrator) updateEndpointsToVersion11() error {
	legacyEndpoints, err := m.EndpointService.Endpoints()
	if err != nil {
		return err
	}

	for _, endpoint := range legacyEndpoints {
		if endpoint.Type == portainer.AgentOnDockerEnvironment {
			endpoint.TLSConfig.TLS = true
			endpoint.TLSConfig.TLSSkipVerify = true
		} else {
			if endpoint.TLSConfig.TLSSkipVerify && !endpoint.TLSConfig.TLS {
				endpoint.TLSConfig.TLSSkipVerify = false
			}
		}

		err = m.EndpointService.UpdateEndpoint(endpoint.ID, &endpoint)
		if err != nil {
			return err
		}
	}

	return nil
}
