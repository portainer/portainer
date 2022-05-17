package datastore

import (
	"fmt"
	"runtime/debug"

	"github.com/portainer/portainer/api/cli"
	"github.com/portainer/portainer/api/dataservices/errors"
	plog "github.com/portainer/portainer/api/datastore/log"
	"github.com/portainer/portainer/api/datastore/migrator"
	"github.com/portainer/portainer/api/internal/authorization"
	"github.com/sirupsen/logrus"

	werrors "github.com/pkg/errors"
	portainer "github.com/portainer/portainer/api"
)

const beforePortainerVersionUpgradeBackup = "portainer.db.bak"

var migrateLog = plog.NewScopedLog("database, migrate")

func (store *Store) MigrateData() error {
	version, err := store.version()
	if err != nil {
		return err
	}

	// Backup Database
	backupPath, err := store.Backup()
	if err != nil {
		return werrors.Wrap(err, "while backing up db before migration")
	}

	migratorParams := &migrator.MigratorParameters{
		DatabaseVersion:         version,
		EndpointGroupService:    store.EndpointGroupService,
		EndpointService:         store.EndpointService,
		EndpointRelationService: store.EndpointRelationService,
		ExtensionService:        store.ExtensionService,
		FDOProfilesService:      store.FDOProfilesService,
		RegistryService:         store.RegistryService,
		ResourceControlService:  store.ResourceControlService,
		RoleService:             store.RoleService,
		ScheduleService:         store.ScheduleService,
		SettingsService:         store.SettingsService,
		StackService:            store.StackService,
		TagService:              store.TagService,
		TeamMembershipService:   store.TeamMembershipService,
		UserService:             store.UserService,
		VersionService:          store.VersionService,
		FileService:             store.fileService,
		DockerhubService:        store.DockerHubService,
		AuthorizationService:    authorization.NewService(store),
	}

	// restore on error
	err = store.connectionMigrateData(migratorParams)
	if err != nil {
		logrus.Errorf("While DB migration %v. Restoring DB", err)
		// Restore options
		options := BackupOptions{
			BackupPath: backupPath,
		}
		err := store.restoreWithOptions(&options)
		if err != nil {
			logrus.Fatalf(
				"Failed restoring the backup. portainer database file needs to restored manually by "+
					"replacing %s database file with recent backup %s. Error %v",
				store.databasePath(),
				options.BackupPath,
				err,
			)
		}
	}

	return err
}

// FailSafeMigrate backup and restore DB if migration fail
func (store *Store) FailSafeMigrate(migrator *migrator.Migrator) (err error) {
	defer func() {
		if e := recover(); e != nil {
			store.Rollback(true)
			// return error with cause and stacktrace (recover() doesn't include a stacktrace)
			err = fmt.Errorf("%v %s", e, string(debug.Stack()))
		}
	}()

	// !Important: we must use a named return value in the function definition and not a local
	// !variable referenced from the closure or else the return value will be incorrectly set
	return migrator.Migrate()
}

// MigrateData automatically migrate the data based on the DBVersion.
// This process is only triggered on an existing database, not if the database was just created.
// if force is true, then migrate regardless.
func (store *Store) connectionMigrateData(migratorParams *migrator.MigratorParameters) error {
	migrator := migrator.NewMigrator(migratorParams)

	// backup db file before upgrading DB to support rollback
	isUpdating, err := migratorParams.VersionService.IsUpdating()
	if err != nil && err != errors.ErrObjectNotFound {
		return err
	}

	if !isUpdating && migrator.Version() != portainer.DBVersion {
		err = store.backupVersion(migrator)
		if err != nil {
			return werrors.Wrapf(err, "failed to backup database")
		}
	}

	if migrator.Version() < portainer.DBVersion {
		migrateLog.Info(fmt.Sprintf("Migrating database from version %v to %v.\n", migrator.Version(), portainer.DBVersion))
		err = store.FailSafeMigrate(migrator)
		if err != nil {
			migrateLog.Error("An error occurred during database migration", err)
			return err
		}
	}

	return nil
}

// backupVersion will backup the database or panic if any errors occur
func (store *Store) backupVersion(migrator *migrator.Migrator) error {
	migrateLog.Info("Backing up database prior to version upgrade...")

	options := getBackupRestoreOptions(store.commonBackupDir())

	_, err := store.backupWithOptions(options)
	if err != nil {
		migrateLog.Error("An error occurred during database backup", err)
		removalErr := store.removeWithOptions(options)
		if removalErr != nil {
			migrateLog.Error("An error occurred during store removal prior to backup", err)
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
