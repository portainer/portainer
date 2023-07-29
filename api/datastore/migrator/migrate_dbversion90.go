package migrator

import (
	"github.com/rs/zerolog/log"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
)

func (m *Migrator) migrateDBVersionToDB90() error {
	if err := m.updateUserThemeForDB90(); err != nil {
		return err
	}

	if err := m.updateEnableGpuManagementFeatures(); err != nil {
		return err
	}

	return m.updateEdgeStackStatusForDB90()
}

func (m *Migrator) updateEdgeStackStatusForDB90() error {
	log.Info().Msg("clean up deleted endpoints from edge jobs")

	edgeJobs, err := m.edgeJobService.ReadAll()
	if err != nil {
		return err
	}

	for _, edgeJob := range edgeJobs {
		for endpointId := range edgeJob.Endpoints {
			_, err := m.endpointService.Endpoint(endpointId)
			if dataservices.IsErrObjectNotFound(err) {
				delete(edgeJob.Endpoints, endpointId)

				err = m.edgeJobService.Update(edgeJob.ID, &edgeJob)
				if err != nil {
					return err
				}
			}
		}
	}

	return nil
}

func (m *Migrator) updateUserThemeForDB90() error {
	log.Info().Msg("updating existing user theme settings")

	users, err := m.userService.ReadAll()
	if err != nil {
		return err
	}

	for i := range users {
		user := &users[i]
		if user.UserTheme != "" {
			user.ThemeSettings.Color = user.UserTheme
		}

		if err := m.userService.Update(user.ID, user); err != nil {
			return err
		}
	}

	return nil
}

func (m *Migrator) updateEnableGpuManagementFeatures() error {
	// get all environments
	environments, err := m.endpointService.Endpoints()
	if err != nil {
		return err
	}

	for _, environment := range environments {
		if environment.Type == portainer.DockerEnvironment {
			// set the PostInitMigrations.MigrateGPUs to true on this environment to run the migration only on the 2.18 upgrade
			environment.PostInitMigrations.MigrateGPUs = true
			// if there's one or more gpu, set the EnableGpuManagement setting to true
			gpuList := environment.Gpus
			if len(gpuList) > 0 {
				environment.EnableGPUManagement = true
			}
			// update the environment
			if err := m.endpointService.UpdateEndpoint(environment.ID, &environment); err != nil {
				return err
			}
		}
	}
	return nil
}
