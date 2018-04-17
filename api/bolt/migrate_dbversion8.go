package bolt

import "github.com/portainer/portainer"

func (m *Migrator) updateEndpointsToVersion9() error {
	legacyEndpoints, err := m.EndpointService.Endpoints()
	if err != nil {
		return err
	}

	for _, endpoint := range legacyEndpoints {
		endpoint.Type = portainer.DockerEnvironment
		err = m.EndpointService.UpdateEndpoint(endpoint.ID, &endpoint)
		if err != nil {
			return err
		}
	}

	return nil
}
