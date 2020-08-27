package bolt

import (
	"log"
	"path"
	"time"

	"github.com/boltdb/bolt"
	"github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/bolt/customtemplate"
	"github.com/portainer/portainer/api/bolt/dockerhub"
	"github.com/portainer/portainer/api/bolt/edgegroup"
	"github.com/portainer/portainer/api/bolt/edgejob"
	"github.com/portainer/portainer/api/bolt/edgestack"
	"github.com/portainer/portainer/api/bolt/endpoint"
	"github.com/portainer/portainer/api/bolt/endpointgroup"
	"github.com/portainer/portainer/api/bolt/endpointrelation"
	"github.com/portainer/portainer/api/bolt/errors"
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
	"github.com/portainer/portainer/api/bolt/tunnelserver"
	"github.com/portainer/portainer/api/bolt/user"
	"github.com/portainer/portainer/api/bolt/version"
	"github.com/portainer/portainer/api/bolt/webhook"
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
		return store.VersionService.StoreDBVersion(portainer.DBVersion)
	}

	version, err := store.VersionService.DBVersion()
	if err == errors.ErrObjectNotFound {
		version = 0
	} else if err != nil {
		return err
	}

	if version < portainer.DBVersion {
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

	customTemplateService, err := customtemplate.NewService(store.db)
	if err != nil {
		return err
	}
	store.CustomTemplateService = customTemplateService

	dockerhubService, err := dockerhub.NewService(store.db)
	if err != nil {
		return err
	}
	store.DockerHubService = dockerhubService

	edgeStackService, err := edgestack.NewService(store.db)
	if err != nil {
		return err
	}
	store.EdgeStackService = edgeStackService

	edgeGroupService, err := edgegroup.NewService(store.db)
	if err != nil {
		return err
	}
	store.EdgeGroupService = edgeGroupService

	edgeJobService, err := edgejob.NewService(store.db)
	if err != nil {
		return err
	}
	store.EdgeJobService = edgeJobService

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

	endpointRelationService, err := endpointrelation.NewService(store.db)
	if err != nil {
		return err
	}
	store.EndpointRelationService = endpointRelationService

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

// CustomTemplate gives access to the CustomTemplate data management layer
func (store *Store) CustomTemplate() portainer.CustomTemplateService {
	return store.CustomTemplateService
}

// DockerHub gives access to the DockerHub data management layer
func (store *Store) DockerHub() portainer.DockerHubService {
	return store.DockerHubService
}

// EdgeGroup gives access to the EdgeGroup data management layer
func (store *Store) EdgeGroup() portainer.EdgeGroupService {
	return store.EdgeGroupService
}

// EdgeJob gives access to the EdgeJob data management layer
func (store *Store) EdgeJob() portainer.EdgeJobService {
	return store.EdgeJobService
}

// EdgeStack gives access to the EdgeStack data management layer
func (store *Store) EdgeStack() portainer.EdgeStackService {
	return store.EdgeStackService
}

// Endpoint gives access to the Endpoint data management layer
func (store *Store) Endpoint() portainer.EndpointService {
	return store.EndpointService
}

// EndpointGroup gives access to the EndpointGroup data management layer
func (store *Store) EndpointGroup() portainer.EndpointGroupService {
	return store.EndpointGroupService
}

// EndpointRelation gives access to the EndpointRelation data management layer
func (store *Store) EndpointRelation() portainer.EndpointRelationService {
	return store.EndpointRelationService
}

// Registry gives access to the Registry data management layer
func (store *Store) Registry() portainer.RegistryService {
	return store.RegistryService
}

// ResourceControl gives access to the ResourceControl data management layer
func (store *Store) ResourceControl() portainer.ResourceControlService {
	return store.ResourceControlService
}

// Role gives access to the Role data management layer
func (store *Store) Role() portainer.RoleService {
	return store.RoleService
}

// Settings gives access to the Settings data management layer
func (store *Store) Settings() portainer.SettingsService {
	return store.SettingsService
}

// Stack gives access to the Stack data management layer
func (store *Store) Stack() portainer.StackService {
	return store.StackService
}

// Tag gives access to the Tag data management layer
func (store *Store) Tag() portainer.TagService {
	return store.TagService
}

// TeamMembership gives access to the TeamMembership data management layer
func (store *Store) TeamMembership() portainer.TeamMembershipService {
	return store.TeamMembershipService
}

// Team gives access to the Team data management layer
func (store *Store) Team() portainer.TeamService {
	return store.TeamService
}

// TunnelServer gives access to the TunnelServer data management layer
func (store *Store) TunnelServer() portainer.TunnelServerService {
	return store.TunnelServerService
}

// User gives access to the User data management layer
func (store *Store) User() portainer.UserService {
	return store.UserService
}

// Version gives access to the Version data management layer
func (store *Store) Version() portainer.VersionService {
	return store.VersionService
}

// Webhook gives access to the Webhook data management layer
func (store *Store) Webhook() portainer.WebhookService {
	return store.WebhookService
}
