package migrator

import (
	"github.com/portainer/portainer/api/internal/endpointutils"

	"github.com/rs/zerolog/log"
)

func (m *Migrator) migrateDBVersionToDB40() error {
	return m.trustCurrentEdgeEndpointsDB40()
}

func (m *Migrator) trustCurrentEdgeEndpointsDB40() error {
	log.Info().Msg("trusting current edge endpoints")

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
