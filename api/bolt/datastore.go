package bolt

import (
	"log"
	"path"
	"time"

	"github.com/portainer/portainer/api/bolt/tunnelserver"

	"github.com/boltdb/bolt"
	"github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/bolt/dockerhub"
	"github.com/portainer/portainer/api/bolt/endpoint"
	"github.com/portainer/portainer/api/bolt/endpointgroup"
	"github.com/portainer/portainer/api/bolt/extension"
	"github.com/portainer/portainer/api/bolt/migrator"
	"github.com/portainer/portainer/api/bolt/registry"
	"github.com/portainer/portainer/api/bolt/resourcecontrol"
	"github.com/portainer/portainer/api/bolt/role"
	"github.com/portainer/portainer/api/bolt/schedule"
	"github.com/portainer/portainer/api/bolt/settings"
	"github.com/portainer/portainer/api/bolt/stack"
	"github.com/portainer/portainer/api/bolt/tag"
	"github.com/portainer/portainer/api/bolt/team"
	"github.com/portainer/portainer/api/bolt/teammembership"
	"github.com/portainer/portainer/api/bolt/template"
	"github.com/portainer/portainer/api/bolt/user"
	"github.com/portainer/portainer/api/bolt/version"
	"github.com/portainer/portainer/api/bolt/webhook"
)

const (
	databaseFileName = "portainer.db"
)

// Store defines the implementation of portainer.DataStore using
// BoltDB as the storage system.
type Store struct {
	path                   string
	db                     *bolt.DB
	checkForDataMigration  bool
	fileService            portainer.FileService
	RoleService            *role.Service
	DockerHubService       *dockerhub.Service
	EndpointGroupService   *endpointgroup.Service
	EndpointService        *endpoint.Service
	ExtensionService       *extension.Service
	RegistryService        *registry.Service
	ResourceControlService *resourcecontrol.Service
	SettingsService        *settings.Service
	StackService           *stack.Service
	TagService             *tag.Service
	TeamMembershipService  *teammembership.Service
	TeamService            *team.Service
	TemplateService        *template.Service
	TunnelServerService    *tunnelserver.Service
	UserService            *user.Service
	VersionService         *version.Service
	WebhookService         *webhook.Service
	ScheduleService        *schedule.Service
}

// NewStore initializes a new Store and the associated services
func NewStore(storePath string, fileService portainer.FileService) (*Store, error) {
	store := &Store{
		path:        storePath,
		fileService: fileService,
	}

	databasePath := path.Join(storePath, databaseFileName)
	databaseFileExists, err := fileService.FileExists(databasePath)
	if err != nil {
		return nil, err
	}

	if !databaseFileExists {
		store.checkForDataMigration = false
	} else {
		store.checkForDataMigration = true
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

// MigrateData automatically migrate the data based on the DBVersion.
func (store *Store) MigrateData() error {
	if !store.checkForDataMigration {
		return store.VersionService.StoreDBVersion(portainer.DBVersion)
	}

	version, err := store.VersionService.DBVersion()
	if err == portainer.ErrObjectNotFound {
		version = 0
	} else if err != nil {
		return err
	}

	if version < portainer.DBVersion {
		migratorParams := &migrator.Parameters{
			DB:                     store.db,
			DatabaseVersion:        version,
			EndpointGroupService:   store.EndpointGroupService,
			EndpointService:        store.EndpointService,
			ExtensionService:       store.ExtensionService,
			RegistryService:        store.RegistryService,
			ResourceControlService: store.ResourceControlService,
			RoleService:            store.RoleService,
			ScheduleService:        store.ScheduleService,
			SettingsService:        store.SettingsService,
			StackService:           store.StackService,
			TeamMembershipService:  store.TeamMembershipService,
			TemplateService:        store.TemplateService,
			UserService:            store.UserService,
			VersionService:         store.VersionService,
			FileService:            store.fileService,
		}
		migrator := migrator.NewMigrator(migratorParams)

		log.Printf("Migrating database from version %v to %v.\n", version, portainer.DBVersion)
		err = migrator.Migrate()
		if err != nil {
			log.Printf("An error occurred during database migration: %s\n", err)
			return err
		}
	}

	return nil
}

func (store *Store) initServices() error {
	authorizationsetService, err := role.NewService(store.db)
	if err != nil {
		return err
	}
	store.RoleService = authorizationsetService

	dockerhubService, err := dockerhub.NewService(store.db)
	if err != nil {
		return err
	}
	store.DockerHubService = dockerhubService

	endpointgroupService, err := endpointgroup.NewService(store.db)
	if err != nil {
		return err
	}
	store.EndpointGroupService = endpointgroupService

	endpointService, err := endpoint.NewService(store.db)
	if err != nil {
		return err
	}
	store.EndpointService = endpointService

	extensionService, err := extension.NewService(store.db)
	if err != nil {
		return err
	}
	store.ExtensionService = extensionService

	registryService, err := registry.NewService(store.db)
	if err != nil {
		return err
	}
	store.RegistryService = registryService

	resourcecontrolService, err := resourcecontrol.NewService(store.db)
	if err != nil {
		return err
	}
	store.ResourceControlService = resourcecontrolService

	settingsService, err := settings.NewService(store.db)
	if err != nil {
		return err
	}
	store.SettingsService = settingsService

	stackService, err := stack.NewService(store.db)
	if err != nil {
		return err
	}
	store.StackService = stackService

	tagService, err := tag.NewService(store.db)
	if err != nil {
		return err
	}
	store.TagService = tagService

	teammembershipService, err := teammembership.NewService(store.db)
	if err != nil {
		return err
	}
	store.TeamMembershipService = teammembershipService

	teamService, err := team.NewService(store.db)
	if err != nil {
		return err
	}
	store.TeamService = teamService

	templateService, err := template.NewService(store.db)
	if err != nil {
		return err
	}
	store.TemplateService = templateService

	tunnelServerService, err := tunnelserver.NewService(store.db)
	if err != nil {
		return err
	}
	store.TunnelServerService = tunnelServerService

	userService, err := user.NewService(store.db)
	if err != nil {
		return err
	}
	store.UserService = userService

	versionService, err := version.NewService(store.db)
	if err != nil {
		return err
	}
	store.VersionService = versionService

	webhookService, err := webhook.NewService(store.db)
	if err != nil {
		return err
	}
	store.WebhookService = webhookService

	scheduleService, err := schedule.NewService(store.db)
	if err != nil {
		return err
	}
	store.ScheduleService = scheduleService

	return nil
}
