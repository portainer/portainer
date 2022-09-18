package migrator

import (
	"reflect"
	"runtime"

	"github.com/pkg/errors"
	portainer "github.com/portainer/portainer/api"

	"github.com/Masterminds/semver"
	"github.com/rs/zerolog/log"
)

// !NOTE: Migration funtions should be idempotent.
// Which simply means the function can run over the same data many times but only transform it once.
// In practice this really just means an extra check or two to ensure we're not valid data.

func (m *Migrator) initMigrations() []migrations {
	// !IMPORTANT: Do not be tempted to alter the order of these migrations.
	// !           Even though one of them look out of order.
	return []migrations{
		newMigration("1.0.0", dbTooOldError), // default version found after migration

		newMigration("1.21",
			m.updateUsersToDBVersion18,
			m.updateEndpointsToDBVersion18,
			m.updateEndpointGroupsToDBVersion18,
			m.updateRegistriesToDBVersion18),
		newMigration("1.22",
			m.updateSettingsToDBVersion19),
		newMigration("1.22.1",
			m.updateUsersToDBVersion20,
			m.updateSettingsToDBVersion20,
			m.updateSchedulesToDBVersion20),
		newMigration("1.23",
			m.updateResourceControlsToDBVersion22,
			m.updateUsersAndRolesToDBVersion22),
		newMigration("1.24",
			m.updateTagsToDBVersion23,
			m.updateEndpointsAndEndpointGroupsToDBVersion23),
		newMigration("1.24.1", m.updateSettingsToDB24),
		newMigration("2.0",
			m.updateSettingsToDB25,
			m.updateStacksToDB24),
		newMigration("2.1",
			m.updateEndpointSettingsToDB25),
		newMigration("2.2",
			m.updateStackResourceControlToDB27),
		newMigration("2.6",
			m.migrateDBVersionToDB30),
		newMigration("2.9",
			m.migrateDBVersionToDB32),
		newMigration("2.9.2",
			m.migrateDBVersionToDB33),
		newMigration("2.10.0",
			m.migrateDBVersionToDB34),
		newMigration("2.9.3",
			m.migrateDBVersionToDB35),
		newMigration("2.12",
			m.migrateDBVersionToDB36),
		newMigration("2.13",
			m.migrateDBVersionToDB40),
		newMigration("2.14",
			m.migrateDBVersionToDB50),
		newMigration("2.15",
			m.migrateDBVersionToDB60),
		newMigration("2.16",
			m.migrateDBVersionToDB70),
		newMigration("2.16.1", m.migrateDBVersionToDB71),

		// Add new migrations below...
		// One function per migration, each versions migration funcs in the same file.
	}
}

type migrations struct {
	version        *semver.Version
	migrationFuncs []func() error
}

func migrationError(err error, context string) error {
	return errors.Wrap(err, "failed in "+context)
}

func newMigration(v string, funcs ...func() error) migrations {
	return migrations{
		version:        semver.MustParse(v),
		migrationFuncs: funcs,
	}
}

func dbTooOldError() error {
	return errors.New("migrating from less than Portainer 1.21.0 is not supported, please contact Portainer support")
}

func GetFunctionName(i interface{}) string {
	return runtime.FuncForPC(reflect.ValueOf(i).Pointer()).Name()
}

// Migrate checks the database version and migrate the existing data to the most recent data model.
func (m *Migrator) Migrate() error {

	log.Info().Msg("migrating database")

	// set DB to updating status
	err := m.versionService.StoreIsUpdating(true)
	if err != nil {
		return migrationError(err, "StoreIsUpdating")
	}

	version, err := m.versionService.Version()
	if err != nil {
		return migrationError(err, "get version service")
	}

	schemaVersion, err := semver.NewVersion(version.SchemaVersion)
	if err != nil {
		return migrationError(err, "invalid db schema version")
	}

	migrations := m.initMigrations()

	count := version.MigratorCount
	for _, migration := range migrations {
		if schemaVersion.LessThan(migration.version) {
			count = 0 // reset build number

			log.Info().Msgf("migrating db to %s", migration.version.String())
			err := runMigrations(migration.migrationFuncs)
			if err != nil {
				return err
			}
		} else if schemaVersion.Equal(migration.version) {
			// If new migrations have been added for this version then we run them all again over
			// the same data.
			if count < len(migration.migrationFuncs) {
				err := runMigrations(migration.migrationFuncs)
				if err != nil {
					return err
				}

				count = len(migration.migrationFuncs)
			}
		}
	}

	version.SchemaVersion = portainer.APIVersion
	version.MigratorCount = count

	err = m.versionService.UpdateVersion(version)
	if err != nil {
		return migrationError(err, "StoreDBVersion")
	}

	log.Info().Msgf("migrating DB to %s", portainer.APIVersion)

	// reset DB updating status
	return m.versionService.StoreIsUpdating(false)
}

func runMigrations(migrationFuncs []func() error) error {
	for _, migrationFunc := range migrationFuncs {
		err := migrationFunc()
		if err != nil {
			return migrationError(err, GetFunctionName(migrationFunc))
		}
	}
	return nil
}
