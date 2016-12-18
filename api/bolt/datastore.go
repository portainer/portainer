package bolt

import (
	"github.com/boltdb/bolt"
	"time"
)

// Store defines the implementation of portainer.DataStore using
// BoltDB as the storage system.
type Store struct {
	// Path where is stored the BoltDB database.
	Path string

	// Services
	UserService *UserService

	db *bolt.DB
}

const (
	databaseFileName = "portainer.db"
	userBucketName   = "users"
)

// NewStore initializes a new Store and the associated services
func NewStore(storePath string) *Store {
	store := &Store{
		Path:        storePath,
		UserService: &UserService{},
	}
	store.UserService.store = store
	return store
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
		_, err := tx.CreateBucketIfNotExists([]byte(userBucketName))
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
