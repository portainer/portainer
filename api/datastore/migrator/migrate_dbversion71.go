package migrator

import (
	"github.com/portainer/portainer/api/dataservices"

	"github.com/rs/zerolog/log"
)

func (m *Migrator) migrateDBVersionToDB71() error {
	log.Info().Msg("removing orphaned snapshots")

	snapshots, err := m.snapshotService.ReadAll()
	if err != nil {
		return err
	}

	for _, s := range snapshots {
		_, err := m.endpointService.Endpoint(s.EndpointID)
		if err == nil {
			log.Debug().Int("endpoint_id", int(s.EndpointID)).Msg("keeping snapshot")
			continue
		} else if !dataservices.IsErrObjectNotFound(err) {
			log.Debug().Int("endpoint_id", int(s.EndpointID)).Err(err).Msg("database error")
			return err
		}

		log.Debug().Int("endpoint_id", int(s.EndpointID)).Msg("removing snapshot")

		err = m.snapshotService.Delete(s.EndpointID)
		if err != nil {
			return err
		}
	}

	return nil
}
