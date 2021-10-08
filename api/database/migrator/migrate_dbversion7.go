package migrator

import "github.com/portainer/portainer/api"

func (m *Migrator) updateEndpointsToVersion8() error {
	legacyEndpoints, err := m.endpointService.Endpoints()
	if err != nil {
		return err
	}

	for _, endpoint := range legacyEndpoints {
		endpoint.Extensions = []portainer.EndpointExtension{}
		err = m.endpointService.UpdateEndpoint(endpoint.ID, &endpoint)
		if err != nil {
			return err
		}
	}

	return nil
}
