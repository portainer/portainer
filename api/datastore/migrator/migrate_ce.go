package migrator

import (
	"reflect"
	"runtime"

	"github.com/pkg/errors"
	portainer "github.com/portainer/portainer/api"

	"github.com/Masterminds/semver"
	"github.com/rs/zerolog/log"
)

// !NOTE: Migration funtions should ideally be idempotent.
// Which simply means the function can run over the same data many times but only transform it once.
// In practice this really just means an extra check or two to ensure we're not destroying valid data.
// This is not a hard rule though.  Understand the limitations.  A migration function may only run over
// the data more than once if a new migration function is added and the version of your database schema is
// the same.  e.g. two developers working on the same version add two different functions for different things.
// This increases the migration funcs count and so they all run again.

type Migrations struct {
	version        *semver.Version
	migrationFuncs MigrationFuncs
}

type MigrationFuncs []func() error

var migrations []Migrations

func (m *Migrator) Init() {
	// !IMPORTANT: Do not be tempted to alter the order of these migrations.
	// !           Even though one of them look out of order.
	migrations = []Migrations{
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

func migrationError(err error, context string) error {
	return errors.Wrap(err, "failed in "+context)
}

func newMigration(v string, funcs ...func() error) Migrations {
	return Migrations{
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
	version, err := m.versionService.Version()
	if err != nil {
		return migrationError(err, "get version service")
	}

	schemaVersion, err := semver.NewVersion(version.SchemaVersion)
	if err != nil {
		return migrationError(err, "invalid db schema version")
	}

	newMigratorCount := 0
	versionUpdateRequired := false
	if schemaVersion.Equal(semver.MustParse(portainer.APIVersion)) {
		// detect and run migrations when the versions are the same.
		// e.g. development builds
		latestMigrations := migrations[len(migrations)-1]
		if latestMigrations.version.Equal(schemaVersion) &&
			version.MigratorCount != len(latestMigrations.migrationFuncs) {

			versionUpdateRequired = true
			err := runMigrations(latestMigrations.migrationFuncs)
			if err != nil {
				return err
			}
			newMigratorCount = len(latestMigrations.migrationFuncs)
		}
	} else {
		// regular path when major/minor/patch versions differ
		for _, migration := range migrations {
			if schemaVersion.LessThan(migration.version) {
				versionUpdateRequired = true
				log.Info().Msgf("migrating data to %s", migration.version.String())
				err := runMigrations(migration.migrationFuncs)
				if err != nil {
					return err
				}
			}

			newMigratorCount = len(migration.migrationFuncs)
		}
	}
	if versionUpdateRequired || newMigratorCount != version.MigratorCount {
		version.SchemaVersion = portainer.APIVersion
		version.MigratorCount = newMigratorCount

		err = m.versionService.UpdateVersion(version)
		if err != nil {
			return migrationError(err, "StoreDBVersion")
		}

		log.Info().Msgf("db migrated to %s", portainer.APIVersion)
	}

	return nil
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

func (m *Migrator) NeedsMigration() bool {
	// we need to migrate if anything changes with the version in the DB vs what our software version is.
	// If the version matches, then it's all down to the number of migration funcs we have for the current version
	// i.e. the MigratorCount

	// In this particular instance we should log a fatal error
	if m.CurrentDBEdition() != portainer.PortainerCE {
		log.Fatal().Msg("the Portainer database is set for Portainer Business Edition, please follow the instructions in our documentation to downgrade it: https://documentation.portainer.io/v2.0-be/downgrade/be-to-ce/")
		return false
	}

	if m.CurrentSemanticDBVersion().LessThan(semver.MustParse(portainer.APIVersion)) {
		return true
	}

	// Check if we have any migrations for the current version
	latestMigrations := migrations[len(migrations)-1]
	if latestMigrations.version.Equal(semver.MustParse(portainer.APIVersion)) {
		if m.currentDBVersion.MigratorCount != len(latestMigrations.migrationFuncs) {
			return true
		}
	} else {
		// One remaining possibility if we get here.  If our migrator count > 0 and we have no migration funcs
		// for the current version (i.e. they were deleted during development).  Then we we need to migrate.
		// This is to reset the migrator count back to 0
		if m.currentDBVersion.MigratorCount > 0 {
			return true
		}
	}

	return false
}
