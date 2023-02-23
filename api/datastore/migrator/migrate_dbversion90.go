package migrator

import (
	"github.com/rs/zerolog/log"

	portainerDsErrors "github.com/portainer/portainer/api/dataservices/errors"
)

func (m *Migrator) migrateDBVersionToDB90() error {
	if err := m.updateUserThemForDB90(); err != nil {
		return err
	}

	return m.updateEdgeStackStatusForDB90()
}

func (m *Migrator) updateEdgeStackStatusForDB90() error {
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

func (m *Migrator) updateUserThemForDB90() error {
	log.Info().Msg("updating existing user theme settings")

	users, err := m.userService.Users()
	if err != nil {
		return err
	}

	for i := range users {
		user := &users[i]
		if user.UserTheme != "" {
			user.ThemeSettings.Color = user.UserTheme
		}

		if err := m.userService.UpdateUser(user.ID, user); err != nil {
			return err
		}
	}

	return nil
}
