package datastore

import (
	"fmt"
	"runtime/debug"

	portainer "github.com/portainer/portainer/api"
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
	updating, err := store.VersionService.IsUpdating()
	if err != nil {
		return errors.Wrap(err, "while checking if the store is updating")
	}

	if updating {
		return dserrors.ErrDatabaseIsUpdating
	}

	// migrate new version bucket if required (doesn't write anything to db yet)
	version, err := store.getOrMigrateLegacyVersion()
	if err != nil {
		return errors.Wrap(err, "while migrating legacy version")
	}

	migratorParams := store.newMigratorParameters(version)
	migrator := migrator.NewMigrator(migratorParams)

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
		err = errors.Wrap(err, "failed to migrate database")

		log.Warn().Err(err).Msg("migration failed, restoring database to previous version")
		restorErr := store.restoreWithOptions(&BackupOptions{BackupPath: backupPath})
		if restorErr != nil {
			return errors.Wrap(restorErr, "failed to restore database")
		}

		log.Info().Msg("database restored to previous version")
		return err
	}

	return nil
}

func (store *Store) newMigratorParameters(version *models.Version) *migrator.MigratorParameters {
	return &migrator.MigratorParameters{
		CurrentDBVersion:        version,
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
		EdgeStackService:        store.EdgeStackService,
		EdgeJobService:          store.EdgeJobService,
		TunnelServerService:     store.TunnelServerService,
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

	err = store.VersionService.StoreIsUpdating(true)
	if err != nil {
		return errors.Wrap(err, "while updating the store")
	}

	// now update the version to the new struct (if required)
	err = store.finishMigrateLegacyVersion(version)
	if err != nil {
		return errors.Wrap(err, "while updating version")
	}

	log.Info().Msg("migrating database from version " + version.SchemaVersion + " to " + portainer.APIVersion)

	err = migrator.Migrate()
	if err != nil {
		return err
	}

	err = store.VersionService.StoreIsUpdating(false)
	if err != nil {
		return errors.Wrap(err, "failed to update the store")
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
