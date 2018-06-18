package bolt

import (
	"log"
	"os"
	"time"

	"github.com/boltdb/bolt"
	"github.com/portainer/portainer"
)

// Store defines the implementation of portainer.DataStore using
// BoltDB as the storage system.
type Store struct {
	// Path where is stored the BoltDB database.
	Path string

	// Services
	UserService            *UserService
	TeamService            *TeamService
	TeamMembershipService  *TeamMembershipService
	EndpointService        *EndpointService
	EndpointGroupService   *EndpointGroupService
	ResourceControlService *ResourceControlService
	VersionService         *VersionService
	SettingsService        *SettingsService
	RegistryService        *RegistryService
	DockerHubService       *DockerHubService
	StackService           *StackService
	TagService             *TagService

	db                    *bolt.DB
	checkForDataMigration bool
	FileService           portainer.FileService
}

const (
	databaseFileName          = "portainer.db"
	versionBucketName         = "version"
	userBucketName            = "users"
	teamBucketName            = "teams"
	teamMembershipBucketName  = "team_membership"
	endpointBucketName        = "endpoints"
	endpointGroupBucketName   = "endpoint_groups"
	resourceControlBucketName = "resource_control"
	settingsBucketName        = "settings"
	registryBucketName        = "registries"
	dockerhubBucketName       = "dockerhub"
	stackBucketName           = "stacks"
	tagBucketName             = "tags"
)

// NewStore initializes a new Store and the associated services
func NewStore(storePath string, fileService portainer.FileService) (*Store, error) {
	store := &Store{
		Path:                   storePath,
		UserService:            &UserService{},
		TeamService:            &TeamService{},
		TeamMembershipService:  &TeamMembershipService{},
		EndpointService:        &EndpointService{},
		EndpointGroupService:   &EndpointGroupService{},
		ResourceControlService: &ResourceControlService{},
		VersionService:         &VersionService{},
		SettingsService:        &SettingsService{},
		RegistryService:        &RegistryService{},
		DockerHubService:       &DockerHubService{},
		StackService:           &StackService{},
		TagService:             &TagService{},
		FileService:            fileService,
	}
	store.UserService.store = store
	store.TeamService.store = store
	store.TeamMembershipService.store = store
	store.EndpointService.store = store
	store.EndpointGroupService.store = store
	store.ResourceControlService.store = store
	store.VersionService.store = store
	store.SettingsService.store = store
	store.RegistryService.store = store
	store.DockerHubService.store = store
	store.StackService.store = store
	store.TagService.store = store

	_, err := os.Stat(storePath + "/" + databaseFileName)
	if err != nil && os.IsNotExist(err) {
		store.checkForDataMigration = false
	} else if err != nil {
		return nil, err
	} else {
		store.checkForDataMigration = true
	}

	return store, nil
}

// Open opens and initializes the BoltDB database.
func (store *Store) Open() error {
	path := store.Path + "/" + databaseFileName

	db, err := bolt.Open(path, 0600, &bolt.Options{Timeout: 1 * time.Second})
	if err != nil {
		return err
	}
	store.db = db

	bucketsToCreate := []string{versionBucketName, userBucketName, teamBucketName, endpointBucketName,
		endpointGroupBucketName, resourceControlBucketName, teamMembershipBucketName, settingsBucketName,
		registryBucketName, dockerhubBucketName, stackBucketName, tagBucketName}

	return db.Update(func(tx *bolt.Tx) error {

		for _, bucket := range bucketsToCreate {
			_, err := tx.CreateBucketIfNotExists([]byte(bucket))
			if err != nil {
				return err
			}
		}

		return nil
	})
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
		err := store.VersionService.StoreDBVersion(portainer.DBVersion)
		if err != nil {
			return err
		}
		return nil
	}

	version, err := store.VersionService.DBVersion()
	if err == portainer.ErrDBVersionNotFound {
		version = 0
	} else if err != nil {
		return err
	}

	if version < portainer.DBVersion {
		log.Printf("Migrating database from version %v to %v.\n", version, portainer.DBVersion)
		migrator := NewMigrator(store, version)
		err = migrator.Migrate()
		if err != nil {
			return err
		}
	}

	return nil
}
