package migrator

import (
	"errors"
	"reflect"
	"runtime"

	werrors "github.com/pkg/errors"
	portainer "github.com/portainer/portainer/api"
)

type migration struct {
	dbversion int
	migrate   func() error
}

func migrationError(err error, context string) error {
	return werrors.Wrap(err, "failed in "+context)
}

func newMigration(dbversion int, migrate func() error) migration {
	return migration{
		dbversion: dbversion,
		migrate:   migrate,
	}
}

func dbTooOldError() error {
	return errors.New("migrating from less than Portainer 1.21.0 is not supported, please contact Portainer support.")
}

func GetFunctionName(i interface{}) string {
	return runtime.FuncForPC(reflect.ValueOf(i).Pointer()).Name()
}

// Migrate checks the database version and migrate the existing data to the most recent data model.
func (m *Migrator) Migrate() error {
	// set DB to updating status
	err := m.versionService.StoreIsUpdating(true)
	if err != nil {
		return migrationError(err, "StoreIsUpdating")
	}

	migrations := []migration{
		// Portainer < 1.21.0
		newMigration(17, dbTooOldError),

		// Portainer 1.21.0
		newMigration(18, m.updateUsersToDBVersion18),
		newMigration(18, m.updateEndpointsToDBVersion18),
		newMigration(18, m.updateEndpointGroupsToDBVersion18),
		newMigration(18, m.updateRegistriesToDBVersion18),

		// 1.22.0
		newMigration(19, m.updateSettingsToDBVersion19),

		// 1.22.1
		newMigration(20, m.updateUsersToDBVersion20),
		newMigration(20, m.updateSettingsToDBVersion20),
		newMigration(20, m.updateSchedulesToDBVersion20),

		// Portainer 1.23.0
		// DBVersion 21 is missing as it was shipped as via hotfix 1.22.2
		newMigration(22, m.updateResourceControlsToDBVersion22),
		newMigration(22, m.updateUsersAndRolesToDBVersion22),

		// Portainer 1.24.0
		newMigration(23, m.updateTagsToDBVersion23),
		newMigration(23, m.updateEndpointsAndEndpointGroupsToDBVersion23),

		// Portainer 1.24.1
		newMigration(24, m.updateSettingsToDB24),

		// Portainer 2.0.0
		newMigration(25, m.updateSettingsToDB25),
		newMigration(25, m.updateStacksToDB24), // yes this looks odd. Don't be tempted to move it

		// Portainer 2.1.0
		newMigration(26, m.updateEndpointSettingsToDB25),

		// Portainer 2.2.0
		newMigration(27, m.updateStackResourceControlToDB27),

		// Portainer 2.6.0
		newMigration(30, m.migrateDBVersionToDB30),

		// Portainer 2.9.0
		newMigration(32, m.migrateDBVersionToDB32),

		// Portainer 2.9.1, 2.9.2
		newMigration(33, m.migrateDBVersionToDB33),

		// Portainer 2.10
		newMigration(34, m.migrateDBVersionToDB34),

		// Portainer 2.9.3 (yep out of order, but 2.10 is EE only)
		newMigration(35, m.migrateDBVersionToDB35),

		newMigration(36, m.migrateDBVersionToDB36),

		// Portainer 2.13
		newMigration(40, m.migrateDBVersionToDB40),
	}

	var lastDbVersion int
	for _, migration := range migrations {
		if m.currentDBVersion < migration.dbversion {

			// Print the next line only when the version changes
			if migration.dbversion > lastDbVersion {
				migrateLog.Infof("Migrating DB to version %d", migration.dbversion)
			}

			err := migration.migrate()
			if err != nil {
				return migrationError(err, GetFunctionName(migration.migrate))
			}
		}
		lastDbVersion = migration.dbversion
	}

	migrateLog.Infof("Setting DB version to %d", portainer.DBVersion)
	err = m.versionService.StoreDBVersion(portainer.DBVersion)
	if err != nil {
		return migrationError(err, "StoreDBVersion")
	}
	migrateLog.Infof("Updated DB version to %d", portainer.DBVersion)

	// reset DB updating status
	return m.versionService.StoreIsUpdating(false)
}
