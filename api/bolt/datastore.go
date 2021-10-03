package bolt

import (
	"io"
	"path"
	"time"

	"github.com/boltdb/bolt"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/bolt/errors"
	bolterrors "github.com/portainer/portainer/api/bolt/errors"
	"github.com/portainer/portainer/api/bolt/internal"
)

const (
	databaseFileName = "portainer.db"
)

func (store *Store) version() (int, error) {
	version, err := store.VersionService.DBVersion()
	if err == errors.ErrObjectNotFound {
		version = 0
	}
	return version, err
}

func (store *Store) edition() portainer.SoftwareEdition {
	edition, err := store.VersionService.Edition()
	if err == errors.ErrObjectNotFound {
		edition = portainer.PortainerCE
	}
	return edition
}

// NewStore initializes a new Store and the associated services
func NewStore(storePath string, fileService portainer.FileService) *Store {
	return &Store{
		path:        storePath,
		fileService: fileService,
		isNew:       true,
		connection:  &internal.DbConnection{},
	}
}

// Open opens and initializes the BoltDB database.
func (store *Store) Open() error {
	databasePath := path.Join(store.path, databaseFileName)
	db, err := bolt.Open(databasePath, 0600, &bolt.Options{Timeout: 1 * time.Second})
	if err != nil {
		return err
	}
	store.connection.DB = db

	err = store.initServices()
	if err != nil {
		return err
	}

	// if we have DBVersion in the database then ensure we flag this as NOT a new store
	if _, err := store.VersionService.DBVersion(); err == nil {
		store.isNew = false
	}

	return nil
}

// Close closes the BoltDB database.
// Safe to being called multiple times.
func (store *Store) Close() error {
	if store.connection.DB != nil {
		return store.connection.Close()
	}
	return nil
}

// IsNew returns true if the database was just created and false if it is re-using
// existing data.
func (store *Store) IsNew() bool {
	return store.isNew
}

// BackupTo backs up db to a provided writer.
// It does hot backup and doesn't block other database reads and writes
func (store *Store) BackupTo(w io.Writer) error {
	return store.connection.View(func(tx *bolt.Tx) error {
		_, err := tx.WriteTo(w)
		return err
	})
}

// CheckCurrentEdition checks if current edition is community edition
func (store *Store) CheckCurrentEdition() error {
	if store.edition() != portainer.PortainerCE {
		return errors.ErrWrongDBEdition
	}
	return nil
}

func (store *Store) IsErrObjectNotFound(e error) bool {
	return e == bolterrors.ErrObjectNotFound
}
