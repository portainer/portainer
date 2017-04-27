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
	EndpointService        *EndpointService
	ResourceControlService *ResourceControlService
	VersionService         *VersionService

	db                    *bolt.DB
	checkForDataMigration bool
}

const (
	databaseFileName          = "portainer.db"
	versionBucketName         = "version"
	userBucketName            = "users"
	teamBucketName            = "teams"
	endpointBucketName        = "endpoints"
	resourceControlBucketName = "resource_control"
)

// NewStore initializes a new Store and the associated services
func NewStore(storePath string) (*Store, error) {
	store := &Store{
		Path:                   storePath,
		UserService:            &UserService{},
		TeamService:            &TeamService{},
		EndpointService:        &EndpointService{},
		ResourceControlService: &ResourceControlService{},
		VersionService:         &VersionService{},
	}
	store.UserService.store = store
	store.TeamService.store = store
	store.EndpointService.store = store
	store.ResourceControlService.store = store
	store.VersionService.store = store

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
	return db.Update(func(tx *bolt.Tx) error {
		_, err := tx.CreateBucketIfNotExists([]byte(versionBucketName))
		if err != nil {
			return err
		}
		_, err = tx.CreateBucketIfNotExists([]byte(userBucketName))
		if err != nil {
			return err
		}
		_, err = tx.CreateBucketIfNotExists([]byte(teamBucketName))
		if err != nil {
			return err
		}
		_, err = tx.CreateBucketIfNotExists([]byte(endpointBucketName))
		if err != nil {
			return err
		}
		_, err = tx.CreateBucketIfNotExists([]byte(resourceControlBucketName))
		if err != nil {
			return err
		}
		return nil
	})
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
