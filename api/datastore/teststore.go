package datastore

import (
	"testing"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/database"
	"github.com/portainer/portainer/api/filesystem"

	"github.com/pkg/errors"
	"github.com/rs/zerolog/log"
)

var errTempDir = errors.New("can't create a temp dir")

func (store *Store) GetConnection() portainer.Connection {
	return store.connection
}

func MustNewTestStore(t *testing.T, init, secure bool) (bool, *Store, func()) {
	newStore, store, teardown, err := NewTestStore(t, init, secure)
	if err != nil {
		if !errors.Is(err, errTempDir) {
			teardown()
		}

		log.Fatal().Err(err).Msg("")
	}

	return newStore, store, teardown
}

func NewTestStore(t *testing.T, init, secure bool) (bool, *Store, func(), error) {
	// Creates unique temp directory in a concurrency friendly manner.
	storePath := t.TempDir()
	fileService, err := filesystem.NewService(storePath, "")
	if err != nil {
		return false, nil, nil, err
	}

	secretKey := []byte("apassphrasewhichneedstobe32bytes")
	if !secure {
		secretKey = nil
	}

	connection, err := database.NewDatabase("boltdb", storePath, secretKey)
	if err != nil {
		panic(err)
	}

	store := NewStore(storePath, fileService, connection)
	newStore, err := store.Open()
	if err != nil {
		return newStore, nil, nil, err
	}

	log.Debug().Msg("opened")

	if init {
		err = store.Init()
		if err != nil {
			return newStore, nil, nil, err
		}
	}

	log.Debug().Msg("initialised")

	if newStore {
		// from MigrateData
		store.VersionService.StoreDBVersion(portainer.DBVersion)
		if err != nil {
			return newStore, nil, nil, err
		}
	}

	teardown := func() {
		teardown(store)
	}

	return newStore, store, teardown, nil
}

func teardown(store *Store) {
	err := store.Close()
	if err != nil {
		log.Fatal().Err(err).Msg("")
	}
}
