package migrator

import (
	"github.com/rs/zerolog/log"

	portainerDsErrors "github.com/portainer/portainer/api/dataservices/errors"
)

func (m *Migrator) migrateDBVersionToDB81() error {
	return m.updateEdgeStackStatusForDB81()
}

func (m *Migrator) updateEdgeStackStatusForDB81() error {
	log.Info().Msg("clean up deleted endpoints from edge jobs")

	edgeJobs, err := m.edgeJobService.EdgeJobs()
	if err != nil {
		return err
	}

	for _, edgeJob := range edgeJobs {
		for endpointId := range edgeJob.Endpoints {
			_, err := m.endpointService.Endpoint(endpointId)
			if err == portainerDsErrors.ErrObjectNotFound {
				delete(edgeJob.Endpoints, endpointId)

				err = m.edgeJobService.UpdateEdgeJob(edgeJob.ID, &edgeJob)
				if err != nil {
					return err
				}
			}
		}
	}

	return nil
}
