package database

import (
	"io"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices/errors"
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
func NewStore(storePath string, fileService portainer.FileService, connection portainer.Connection) *Store {
	return &Store{
		fileService: fileService,
		isNew:       true,
		connection:  connection,
	}
}

// Open opens and initializes the BoltDB database.
func (store *Store) Open() error {
	err := store.connection.Open()
	if err != nil {
		return err
	}

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

func (store *Store) Close() error {
	return store.connection.Close()
}

// IsNew returns true if the database was just created and false if it is re-using
// existing data.
func (store *Store) IsNew() bool {
	return store.isNew
}

// BackupTo backs up db to a provided writer.
// It does hot backup and doesn't block other database reads and writes
func (store *Store) BackupTo(w io.Writer) error {
	return store.connection.BackupTo(w)
}

// CheckCurrentEdition checks if current edition is community edition
func (store *Store) CheckCurrentEdition() error {
	if store.edition() != portainer.PortainerCE {
		return errors.ErrWrongDBEdition
	}
	return nil
}

func (store *Store) IsErrObjectNotFound(e error) bool {
	return e == errors.ErrObjectNotFound
}

func (store *Store) Rollback(force bool) error {
	return store.connectionRollback(force)
}
