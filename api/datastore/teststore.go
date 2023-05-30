package datastore

import (
	"testing"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/database"
	"github.com/portainer/portainer/api/database/models"
	"github.com/portainer/portainer/api/filesystem"

	"github.com/rs/zerolog/log"
)

func (store *Store) GetConnection() portainer.Connection {
	return store.connection
}

func MustNewTestStore(t testing.TB, init, secure bool) (bool, *Store) {
	newStore, store, teardown, err := NewTestStore(t, init, secure)
	if err != nil {
		log.Fatal().Err(err).Msg("")
	}

	t.Cleanup(teardown)

	return newStore, store
}

func NewTestStore(t testing.TB, init, secure bool) (bool, *Store, func(), error) {
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

	if init {
		err = store.Init()
		if err != nil {
			return newStore, nil, nil, err
		}
	}

	if newStore {
		// from MigrateData
		v := models.Version{
			SchemaVersion: portainer.APIVersion,
			Edition:       int(portainer.PortainerCE),
		}
		err = store.VersionService.UpdateVersion(&v)
		if err != nil {
			return newStore, nil, nil, err
		}
	}

	teardown := func() {
		err := store.Close()
		if err != nil {
			log.Fatal().Err(err).Msg("")
		}
	}

	return newStore, store, teardown, nil
}
