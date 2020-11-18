package bolt

import (
	"errors"
	"log"
	"path"
	"time"

	"github.com/portainer/portainer/api/bolt/license"

	"github.com/boltdb/bolt"
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/bolt/customtemplate"
	"github.com/portainer/portainer/api/bolt/dockerhub"
	"github.com/portainer/portainer/api/bolt/edgegroup"
	"github.com/portainer/portainer/api/bolt/edgejob"
	"github.com/portainer/portainer/api/bolt/edgestack"
	"github.com/portainer/portainer/api/bolt/endpoint"
	"github.com/portainer/portainer/api/bolt/endpointgroup"
	"github.com/portainer/portainer/api/bolt/endpointrelation"
	bolterrors "github.com/portainer/portainer/api/bolt/errors"
	"github.com/portainer/portainer/api/bolt/extension"
	"github.com/portainer/portainer/api/bolt/migrator"
	"github.com/portainer/portainer/api/bolt/migratoree"
	"github.com/portainer/portainer/api/bolt/registry"
	"github.com/portainer/portainer/api/bolt/resourcecontrol"
	"github.com/portainer/portainer/api/bolt/role"
	"github.com/portainer/portainer/api/bolt/schedule"
	"github.com/portainer/portainer/api/bolt/settings"
	"github.com/portainer/portainer/api/bolt/stack"
	"github.com/portainer/portainer/api/bolt/tag"
	"github.com/portainer/portainer/api/bolt/team"
	"github.com/portainer/portainer/api/bolt/teammembership"
	"github.com/portainer/portainer/api/bolt/tunnelserver"
	"github.com/portainer/portainer/api/bolt/user"
	"github.com/portainer/portainer/api/bolt/version"
	"github.com/portainer/portainer/api/bolt/webhook"
	"github.com/portainer/portainer/api/cli"
	"github.com/portainer/portainer/api/internal/authorization"
)

const (
	databaseFileName = "portainer.db"
)

// Store defines the implementation of portainer.DataStore using
// BoltDB as the storage system.
type Store struct {
	path                    string
	db                      *bolt.DB
	isNew                   bool
	fileService             portainer.FileService
	CustomTemplateService   *customtemplate.Service
	DockerHubService        *dockerhub.Service
	EdgeGroupService        *edgegroup.Service
	EdgeJobService          *edgejob.Service
	EdgeStackService        *edgestack.Service
	EndpointGroupService    *endpointgroup.Service
	EndpointService         *endpoint.Service
	EndpointRelationService *endpointrelation.Service
	ExtensionService        *extension.Service
	LicenseService          *license.Service
	RegistryService         *registry.Service
	ResourceControlService  *resourcecontrol.Service
	RoleService             *role.Service
	ScheduleService         *schedule.Service
	SettingsService         *settings.Service
	StackService            *stack.Service
	TagService              *tag.Service
	TeamMembershipService   *teammembership.Service
	TeamService             *team.Service
	TunnelServerService     *tunnelserver.Service
	UserService             *user.Service
	VersionService          *version.Service
	WebhookService          *webhook.Service
}

// NewStore initializes a new Store and the associated services
func NewStore(storePath string, fileService portainer.FileService) (*Store, error) {
	store := &Store{
		path:        storePath,
		fileService: fileService,
		isNew:       true,
	}

	databasePath := path.Join(storePath, databaseFileName)
	databaseFileExists, err := fileService.FileExists(databasePath)
	if err != nil {
		return nil, err
	}

	if databaseFileExists {
		store.isNew = false
	}

	return store, nil
}

// Open opens and initializes the BoltDB database.
func (store *Store) Open() error {
	databasePath := path.Join(store.path, databaseFileName)
	db, err := bolt.Open(databasePath, 0600, &bolt.Options{Timeout: 1 * time.Second})
	if err != nil {
		return err
	}
	store.db = db

	return store.initServices()
}

// Close closes the BoltDB database.
func (store *Store) Close() error {
	if store.db != nil {
		return store.db.Close()
	}
	return nil
}

// IsNew returns true if the database was just created and false if it is re-using
// existing data.
func (store *Store) IsNew() bool {
	return store.isNew
}

// MigrateData automatically migrate the data based on the DBVersion.
// This process is only triggered on an existing database, not if the database was just created.
func (store *Store) MigrateData() error {
	if store.isNew {
		err := store.VersionService.StoreDBVersion(portainer.DBVersionEE)
		if err != nil {
			return err
		}

		err = store.VersionService.StoreEdition(portainer.PortainerEE)
		if err != nil {
			return err
		}

		return nil
	}

	version, err := store.VersionService.DBVersion()
	if err == bolterrors.ErrObjectNotFound {
		version = 0
	} else if err != nil {
		return err
	}

	edition, err := store.VersionService.Edition()
	if err == bolterrors.ErrObjectNotFound {
		edition = portainer.PortainerCE
	} else if err != nil {
		return err
	}

	if edition == portainer.PortainerCE && version < portainer.DBVersion {
		migratorParams := &migrator.Parameters{
			DB:                      store.db,
			DatabaseVersion:         version,
			EndpointGroupService:    store.EndpointGroupService,
			EndpointService:         store.EndpointService,
			EndpointRelationService: store.EndpointRelationService,
			ExtensionService:        store.ExtensionService,
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
			AuthorizationService:    authorization.NewService(store),
		}
		migrator := migrator.NewMigrator(migratorParams)

		log.Printf("[INFO] [bolt, migrate] [message: Migrating CE database from version %v to %v.]", version, portainer.DBVersion)
		err = migrator.Migrate()
		if err != nil {
			log.Printf("[ERROR] [bolt, migrate] [message: An error occurred during database migration: %s]", err)
			return err
		}

		version = portainer.DBVersion
	}

	if edition < portainer.PortainerEE {
		migratorParams := &migratoree.Parameters{
			CurrentEdition:  edition,
			DB:              store.db,
			DatabaseVersion: version,

			AuthorizationService: authorization.NewService(store),
			EndpointGroupService: store.EndpointGroupService,
			EndpointService:      store.EndpointService,
			ExtensionService:     store.ExtensionService,
			SettingsService:      store.SettingsService,
			UserService:          store.UserService,
			VersionService:       store.VersionService,
			RoleService:          store.RoleService,
		}
		migrator := migratoree.NewMigrator(migratorParams)

		log.Printf("[INFO] [bolt, migrate] [message: Migrating CE database version %d to EE database version %d.]", version, portainer.DBVersionEE)
		err = migrator.MigrateFromCEdbv25()
		if err != nil {
			log.Printf("[ERROR] [bolt, migrate] [message: An error occurred during database migration: %s]", err)
			return err
		}

		version = portainer.DBVersionEE
		edition = portainer.PortainerEE
	}

	if edition == portainer.PortainerBE && version < portainer.DBVersionEE {
		migratorParams := &migratoree.Parameters{
			CurrentEdition:  edition,
			DB:              store.db,
			DatabaseVersion: version,

			AuthorizationService: authorization.NewService(store),
			EndpointGroupService: store.EndpointGroupService,
			EndpointService:      store.EndpointService,
			ExtensionService:     store.ExtensionService,
			SettingsService:      store.SettingsService,
			UserService:          store.UserService,
			VersionService:       store.VersionService,
			RoleService:          store.RoleService,
		}
		migrator := migratoree.NewMigrator(migratorParams)

		log.Printf("[INFO] [bolt, migrate] Migrating EE database from version %v to %v.", version, portainer.DBVersionEE)
		err = migrator.Migrate()
		if err != nil {
			log.Printf("[ERROR] [bolt, migrate] [message: An error occurred during database migration: %s]", err)
			return err
		}

		version = portainer.DBVersionEE
	}

	return nil
}

func (store *Store) backupDBAndRestoreIfFailed(action func() error) error {
	databasePath := path.Join(store.path, databaseFileName)
	backupPath := databasePath + ".old"
	log.Printf("[INFO] [bolt, backup] [message: creating db backup at %s]", backupPath)

	err := store.fileService.Copy(databasePath, backupPath, true)
	if err != nil {
		return err
	}

	err = action()
	if err != nil {
		databasePath := path.Join(store.path, databaseFileName)
		backupPath := databasePath + ".old"
		log.Printf("[INFO] [bolt, backup] [message: restoring db backup from %s after failure] [error: %s]", backupPath, err)

		copyErr := store.fileService.Copy(backupPath, databasePath, true)
		if copyErr != nil {
			log.Printf("[ERROR] [bolt, backup] [message: failed restoring db backup from %s] [error: %s]", backupPath, copyErr)
			return copyErr
		}

		return err
	}

	return nil
}

// RollbackToCE rollbacks the store to the current ce version
func (store *Store) RollbackToCE() error {
	version, err := store.Version().DBVersion()
	if err == bolterrors.ErrObjectNotFound {
		version = 0
	} else if err != nil {
		return err
	}

	edition, err := store.Version().Edition()
	if err == bolterrors.ErrObjectNotFound {
		edition = portainer.PortainerCE
	} else if err != nil {
		return err
	}

	log.Printf("Current Software Edition: %s\n", getEditionLabel(edition))
	log.Printf("Current DB Version: %d\n", version)

	if edition == portainer.PortainerCE {
		return errors.New("DB is already on CE edition")
	}

	confirmed, err := cli.Confirm("Are you sure you want to rollback your database?")
	if err != nil {
		return err
	}

	if !confirmed {
		return nil
	}

	err = store.backupDBAndRestoreIfFailed(func() error {
		migratorParams := &migratoree.Parameters{
			CurrentEdition:  edition,
			DB:              store.db,
			DatabaseVersion: version,

			AuthorizationService: authorization.NewService(store),
			EndpointGroupService: store.EndpointGroupService,
			EndpointService:      store.EndpointService,
			ExtensionService:     store.ExtensionService,
			UserService:          store.UserService,
			VersionService:       store.VersionService,
		}
		migrator := migratoree.NewMigrator(migratorParams)

		return migrator.Rollback()
	})

	if err != nil {
		return err
	}

	log.Printf("Rolled back to CE Edition, DB Version %d\n", portainer.DBVersion)
	return nil
}

func getEditionLabel(edition portainer.SoftwareEdition) string {
	switch edition {
	case portainer.PortainerCE:
		return "CE"
	case portainer.PortainerEE:
		return "EE"
	}

	return ""
}
