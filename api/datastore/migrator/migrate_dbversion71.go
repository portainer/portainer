package migrator

import (
	"github.com/portainer/portainer/api/dataservices/errors"

	"github.com/rs/zerolog/log"
)

func (m *Migrator) migrateDBVersionToDB71() error {
	log.Info().Msg("removing orphaned snapshots")

	snapshots, err := m.snapshotService.Snapshots()
	if err != nil {
		return err
	}

	for _, s := range snapshots {
		e, err := m.endpointService.Endpoint(s.EndpointID)
		if err == nil {
			log.Debug().Int("endpoint_id", int(e.ID)).Msg("keeping snapshot")
			continue
		} else if err != errors.ErrObjectNotFound {
			log.Debug().Int("endpoint_id", int(e.ID)).Err(err).Msg("database error")
			return err
		}

		log.Debug().Int("endpoint_id", int(e.ID)).Msg("removing snapshot")

		err = m.snapshotService.DeleteSnapshot(e.ID)
		if err != nil {
			return err
		}
	}

	return nil
}
