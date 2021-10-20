package migrator

import (
	"fmt"

	werrors "github.com/pkg/errors"
	portainer "github.com/portainer/portainer/api"
)

func migrationError(err error, context string) error {
	return werrors.Wrap(err, "failed in "+context)
}

// Migrate checks the database version and migrate the existing data to the most recent data model.
func (m *Migrator) Migrate() error {
	// set DB to updating status
	err := m.versionService.StoreIsUpdating(true)
	if err != nil {
		return migrationError(err, "StoreIsUpdating")
	}

	if m.currentDBVersion < 17 {
		return migrationError(err, "migrating from less than Portainer 1.21.0 is not supported, please contact Portainer support.")
	}

	// Portainer 1.21.0
	if m.currentDBVersion < 18 {
		err := m.updateUsersToDBVersion18()
		if err != nil {
			return migrationError(err, "updateUsersToDBVersion18")
		}

		err = m.updateEndpointsToDBVersion18()
		if err != nil {
			return migrationError(err, "updateEndpointsToDBVersion18")
		}

		err = m.updateEndpointGroupsToDBVersion18()
		if err != nil {
			return migrationError(err, "updateEndpointGroupsToDBVersion18")
		}

		err = m.updateRegistriesToDBVersion18()
		if err != nil {
			return migrationError(err, "updateRegistriesToDBVersion18")
		}
	}

	// Portainer 1.22.0
	if m.currentDBVersion < 19 {
		err := m.updateSettingsToDBVersion19()
		if err != nil {
			return migrationError(err, "updateSettingsToDBVersion19")
		}
	}

	// Portainer 1.22.1
	if m.currentDBVersion < 20 {
		err := m.updateUsersToDBVersion20()
		if err != nil {
			return migrationError(err, "updateUsersToDBVersion20")
		}

		err = m.updateSettingsToDBVersion20()
		if err != nil {
			return migrationError(err, "updateSettingsToDBVersion20")
		}

		err = m.updateSchedulesToDBVersion20()
		if err != nil {
			return migrationError(err, "updateSchedulesToDBVersion20")
		}
	}

	// Portainer 1.23.0
	// DBVersion 21 is missing as it was shipped as via hotfix 1.22.2
	if m.currentDBVersion < 22 {
		err := m.updateResourceControlsToDBVersion22()
		if err != nil {
			return migrationError(err, "updateResourceControlsToDBVersion22")
		}

		err = m.updateUsersAndRolesToDBVersion22()
		if err != nil {
			return migrationError(err, "updateUsersAndRolesToDBVersion22")
		}
	}

	// Portainer 1.24.0
	if m.currentDBVersion < 23 {
		err := m.updateTagsToDBVersion23()
		if err != nil {
			return migrationError(err, "updateTagsToDBVersion23")
		}

		err = m.updateEndpointsAndEndpointGroupsToDBVersion23()
		if err != nil {
			return migrationError(err, "updateEndpointsAndEndpointGroupsToDBVersion23")
		}
	}

	// Portainer 1.24.1
	if m.currentDBVersion < 24 {
		err := m.updateSettingsToDB24()
		if err != nil {
			return migrationError(err, "updateSettingsToDB24")
		}
	}

	// Portainer 2.0.0
	if m.currentDBVersion < 25 {
		err := m.updateSettingsToDB25()
		if err != nil {
			return migrationError(err, "updateSettingsToDB25")
		}

		err = m.updateStacksToDB24()
		if err != nil {
			return migrationError(err, "updateStacksToDB24")
		}
	}

	// Portainer 2.1.0
	if m.currentDBVersion < 26 {
		err := m.updateEndpointSettingsToDB25()
		if err != nil {
			return migrationError(err, "updateEndpointSettingsToDB25")
		}
	}

	// Portainer 2.2.0
	if m.currentDBVersion < 27 {
		err := m.updateStackResourceControlToDB27()
		if err != nil {
			return migrationError(err, "updateStackResourceControlToDB27")
		}
	}

	// Portainer 2.6.0
	if m.currentDBVersion < 30 {
		err := m.migrateDBVersionToDB30()
		if err != nil {
			return migrationError(err, "migrateDBVersionToDB30")
		}
	}

	// Portainer 2.9.0
	if m.currentDBVersion < 32 {
		err := m.migrateDBVersionToDB32()
		if err != nil {
			return migrationError(err, "migrateDBVersionToDB32")
		}
	}

	// Portainer 2.9.1
	if m.currentDBVersion < 33 {
		err := m.migrateDBVersionToDB33()
		if err != nil {
			return migrationError(err, "migrateDBVersionToDB33")
		}
	}

	// Portainer 2.10
	if m.currentDBVersion < 34 {
		if err := m.migrateDBVersionToDB34(); err != nil {
			return migrationError(err, "migrateDBVersionToDB34")
		}
	}

	err = m.versionService.StoreDBVersion(portainer.DBVersion)
	if err != nil {
		return migrationError(err, "StoreDBVersion")
	}
	migrateLog.Info(fmt.Sprintf("Updated DB version to %d", portainer.DBVersion))

	// reset DB updating status
	return m.versionService.StoreIsUpdating(false)
}
