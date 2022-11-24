package migrator

import (
	portainer "github.com/portainer/portainer/api"

	"github.com/rs/zerolog/log"
)

func (m *Migrator) migrateDBVersionToDB60() error {
	return m.addGpuInputFieldDB60()
}

func (m *Migrator) addGpuInputFieldDB60() error {
	log.Info().Msg("add gpu input field")

	endpoints, err := m.endpointService.Endpoints()
	if err != nil {
		return err
	}

	for _, endpoint := range endpoints {
		if endpoint.Gpus == nil {
			endpoint.Gpus = []portainer.Pair{}
			err = m.endpointService.UpdateEndpoint(endpoint.ID, &endpoint)
			if err != nil {
				return err
			}
		}
	}

	return nil
}
