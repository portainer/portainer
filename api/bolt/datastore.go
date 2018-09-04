package bolt

import (
	"log"
	"path"
	"time"

	"github.com/boltdb/bolt"
	"github.com/portainer/portainer"
	"github.com/portainer/portainer/bolt/dockerhub"
	"github.com/portainer/portainer/bolt/endpoint"
	"github.com/portainer/portainer/bolt/endpointgroup"
	"github.com/portainer/portainer/bolt/migrator"
	"github.com/portainer/portainer/bolt/registry"
	"github.com/portainer/portainer/bolt/resourcecontrol"
	"github.com/portainer/portainer/bolt/settings"
	"github.com/portainer/portainer/bolt/stack"
	"github.com/portainer/portainer/bolt/tag"
	"github.com/portainer/portainer/bolt/team"
	"github.com/portainer/portainer/bolt/teammembership"
	"github.com/portainer/portainer/bolt/template"
	"github.com/portainer/portainer/bolt/user"
	"github.com/portainer/portainer/bolt/version"
	"github.com/portainer/portainer/bolt/deploykey"
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
	DockerHubService       *dockerhub.Service
	EndpointGroupService   *endpointgroup.Service
	EndpointService        *endpoint.Service
	RegistryService        *registry.Service
	ResourceControlService *resourcecontrol.Service
	SettingsService        *settings.Service
	StackService           *stack.Service
	TagService             *tag.Service
	TeamMembershipService  *teammembership.Service
	TeamService            *team.Service
	TemplateService        *template.Service
	UserService            *user.Service
	VersionService         *version.Service
	DeploykeyService             *deploykey.Service
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

// Init creates the default data set.
func (store *Store) Init() error {
	groups, err := store.EndpointGroupService.EndpointGroups()
	if err != nil {
		return err
	}

	if len(groups) == 0 {
		unassignedGroup := &portainer.EndpointGroup{
			Name:            "Unassigned",
			Description:     "Unassigned endpoints",
			Labels:          []portainer.Pair{},
			AuthorizedUsers: []portainer.UserID{},
			AuthorizedTeams: []portainer.TeamID{},
			Tags:            []string{},
		}

		return store.EndpointGroupService.CreateEndpointGroup(unassignedGroup)
	}

	return nil
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
			ResourceControlService: store.ResourceControlService,
			SettingsService:        store.SettingsService,
			StackService:           store.StackService,
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

	deploykeyService, err := deploykey.NewService(store.db)
	if err != nil {
		return err
	}
	store.DeploykeyService = deploykeyService

	return nil
}
