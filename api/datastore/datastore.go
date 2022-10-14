package datastore

import (
	portainer "github.com/portainer/portainer/api"
	portainerErrors "github.com/portainer/portainer/api/dataservices/errors"
	"gorm.io/gorm"
)

func (store *Store) version() (int, error) {
	version, err := store.VersionService.DBVersion()
	if store.IsErrObjectNotFound(err) {
		version = 0
	}
	return version, err
}

func (store *Store) edition() portainer.SoftwareEdition {
	edition, err := store.VersionService.Edition()
	if store.IsErrObjectNotFound(err) {
		edition = portainer.PortainerCE
	}
	return edition
}

// NewStore initializes a new Store and the associated services
func NewStore(storePath string, fileService portainer.FileService, connection portainer.Connection) *Store {
	return &Store{
		fileService: fileService,
		connection:  connection,
	}
}

// Open opens and initializes the BoltDB database.
func (store *Store) Open() (newStore bool, err error) {
	newStore = true

	err = store.connection.Open()
	if err != nil {
		return newStore, err
	}

	err = store.initServices()
	if err != nil {
		return newStore, err
	}

	// if we have DBVersion in the database then ensure we flag this as NOT a new store
	// version, err := store.VersionService.DBVersion()
	// if err != nil {
	// 	if store.IsErrObjectNotFound(err) {
	// 		return newStore, nil
	// 	}

	// 	return newStore, err
	// }

	// if version > 0 {
	// 	log.Debug().Int("version", version).Msg("opened existing store")

	// 	return false, nil
	// }

	return newStore, nil
}

func (store *Store) Close() error {
	return store.connection.Close()
}

// CheckCurrentEdition checks if current edition is community edition
func (store *Store) CheckCurrentEdition() error {
	if store.edition() != portainer.PortainerCE {
		return portainerErrors.ErrWrongDBEdition
	}
	return nil
}

// TODO: move the use of this to dataservices.IsErrObjectNotFound()?
func (store *Store) IsErrObjectNotFound(e error) bool {
	return e == gorm.ErrRecordNotFound
}
