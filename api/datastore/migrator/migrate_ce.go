package migrator

import (
	"reflect"
	"runtime"

	"github.com/pkg/errors"
	portainer "github.com/portainer/portainer/api"

	"github.com/Masterminds/semver"
	"github.com/rs/zerolog/log"
)

func migrationError(err error, context string) error {
	return errors.Wrap(err, "failed in "+context)
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
		latestMigrations := m.latestMigrations()
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
		for _, migration := range m.migrations {
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
	latestMigrations := m.latestMigrations()
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
