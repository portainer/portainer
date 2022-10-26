package datastore

import (
	"fmt"
	"runtime/debug"

	portainer "github.com/portainer/portainer/api"
	portaineree "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/cli"
	"github.com/portainer/portainer/api/database/models"
	dserrors "github.com/portainer/portainer/api/dataservices/errors"
	"github.com/portainer/portainer/api/datastore/migrator"
	"github.com/portainer/portainer/api/internal/authorization"

	"github.com/pkg/errors"
	"github.com/rs/zerolog/log"
)

const beforePortainerVersionUpgradeBackup = "portainer.db.bak"

func (store *Store) MigrateData() error {
	// migrate new version bucket if required (doesn't write anything to db yet)
	version, err := store.getOrMigrateLegacyVersion()
	if err != nil {
		return errors.Wrap(err, "while migrating legacy version")
	}

	migratorParams := store.newMigratorParameters(version)
	migrator := migrator.NewMigrator(migratorParams)
	migrator.Init()

	if !migrator.NeedsMigration() {
		return nil
	}

	// before we alter anything in the DB, create a backup
	backupPath, err := store.Backup(version)
	if err != nil {
		return errors.Wrap(err, "while backing up database")
	}

	err = store.FailSafeMigrate(migrator, version)
	if err != nil {
		err = store.restoreWithOptions(&BackupOptions{BackupPath: backupPath})
		if err != nil {
			return errors.Wrap(err, "failed to restore database")
		}

		fmt.Println("Restored database to previous version")
		return errors.Wrap(err, "failed to migrate database")
	}

	return nil
}

func (store *Store) newMigratorParameters(version *models.Version) *migrator.MigratorParameters {
	return &migrator.MigratorParameters{
		CurrentVersion:          version,
		EndpointGroupService:    store.EndpointGroupService,
		EndpointService:         store.EndpointService,
		EndpointRelationService: store.EndpointRelationService,
		ExtensionService:        store.ExtensionService,
		RegistryService:         store.RegistryService,
		ResourceControlService:  store.ResourceControlService,
		RoleService:             store.RoleService,
		ScheduleService:         store.ScheduleService,
		SettingsService:         store.SettingsService,
		SnapshotService:         store.SnapshotService,
		StackService:            store.StackService,
		TagService:              store.TagService,
		TeamMembershipService:   store.TeamMembershipService,
		UserService:             store.UserService,
		VersionService:          store.VersionService,
		FileService:             store.fileService,
		DockerhubService:        store.DockerHubService,
		AuthorizationService:    authorization.NewService(store),
	}
}

// FailSafeMigrate backup and restore DB if migration fail
func (store *Store) FailSafeMigrate(migrator *migrator.Migrator, version *models.Version) (err error) {
	defer func() {
		if e := recover(); e != nil {
			// return error with cause and stacktrace (recover() doesn't include a stacktrace)
			err = fmt.Errorf("%v %s", e, string(debug.Stack()))
		}
	}()

	// now update the version to the new struct (if required)
	err = store.finishMigrateLegacyVersion(version)
	if err != nil {
		return errors.Wrap(err, "while updating version")
	}

	log.Info().Msg("migrating database from version " + version.SchemaVersion + " to " + portaineree.APIVersion)

	err = migrator.Migrate()
	if err != nil {
		return err
	}

	return nil
}

// MigrateData automatically migrate the data based on the Version.
// This process is only triggered on an existing database, not if the database was just created.
// if force is true, then migrate regardless.
func (store *Store) connectionMigrateData(migratorParams *migrator.MigratorParameters) error {
	migrator := migrator.NewMigrator(migratorParams)

	version, err := migratorParams.VersionService.Version()
	if err != nil {
		return err
	}

	// backup db file before upgrading DB to support rollback
	isUpdating, err := migratorParams.VersionService.IsUpdating()
	if err != nil && err != dserrors.ErrObjectNotFound {
		return err
	}

	if !isUpdating && version.SchemaVersion != portainer.APIVersion {
		err = store.backupVersion(migrator)
		if err != nil {
			return errors.Wrapf(err, "failed to backup database")
		}
	}

	if version.SchemaVersion != portainer.APIVersion {
		log.Info().Msgf("migrating database from version %s to %s ", version.SchemaVersion, portainer.APIVersion)
	}

	err = store.FailSafeMigrate(migrator, version)
	if err != nil {
		log.Error().Err(err).Msg("an error occurred during database migration")
		return err
	}

	return nil
}

// backupVersion will backup the database or panic if any errors occur
func (store *Store) backupVersion(migrator *migrator.Migrator) error {
	log.Info().Msg("backing up database prior to version upgrade")

	options := getBackupRestoreOptions(store.commonBackupDir())

	_, err := store.backupWithOptions(options)
	if err != nil {
		log.Error().Err(err).Msg("an error occurred during database backup")

		removalErr := store.removeWithOptions(options)
		if removalErr != nil {
			log.Error().Err(err).Msg("an error occurred during store removal prior to backup")
		}

		return err
	}

	return nil
}

// Rollback to a pre-upgrade backup copy/snapshot of portainer.db
func (store *Store) connectionRollback(force bool) error {

	if !force {
		confirmed, err := cli.Confirm("Are you sure you want to rollback your database to the previous backup?")
		if err != nil || !confirmed {
			return err
		}
	}

	options := getBackupRestoreOptions(store.commonBackupDir())

	err := store.restoreWithOptions(options)
	if err != nil {
		return err
	}

	return store.connection.Close()
}
