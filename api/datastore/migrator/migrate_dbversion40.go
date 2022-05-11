package migrator

import "github.com/portainer/portainer/api/internal/endpointutils"

func (m *Migrator) migrateDBVersionToDB40() error {
	if err := m.trustCurrentEdgeEndpointsDB40(); err != nil {
		return err
	}

	return nil
}

func (m *Migrator) trustCurrentEdgeEndpointsDB40() error {
	migrateLog.Info("- trusting current edge endpoints")
	endpoints, err := m.endpointService.Endpoints()
	if err != nil {
		return err
	}

	for _, endpoint := range endpoints {
		if endpointutils.IsEdgeEndpoint(&endpoint) {
			endpoint.UserTrusted = true
			err = m.endpointService.UpdateEndpoint(endpoint.ID, &endpoint)
			if err != nil {
				return err
			}
		}
	}

	return nil
}
