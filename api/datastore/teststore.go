package datastore

import (
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/database"
	"io/ioutil"
	"log"
	"os"

	"github.com/pkg/errors"
	"github.com/portainer/portainer/api/filesystem"
)

var errTempDir = errors.New("can't create a temp dir")

func (store *Store) GetConnection() portainer.Connection {
	return store.connection
}

func MustNewTestStore(init bool) (*Store, func()) {
	store, teardown, err := NewTestStore(init)
	if err != nil {
		if !errors.Is(err, errTempDir) {
			teardown()
		}
		log.Fatal(err)
	}

	return store, teardown
}

func NewTestStore(init bool) (*Store, func(), error) {
	// Creates unique temp directory in a concurrency friendly manner.
	storePath, err := ioutil.TempDir("", "test-store")
	if err != nil {
		return nil, nil, errors.Wrap(errTempDir, err.Error())
	}

	fileService, err := filesystem.NewService(storePath, "")
	if err != nil {
		return nil, nil, err
	}

	connection, err := database.NewDatabase(storePath)
	if err != nil {
		panic(err)
	}
	store := NewStore(storePath, fileService, connection)
	err = store.Open()
	if err != nil {
		return nil, nil, err
	}

	if init {
		err = store.Init()
		if err != nil {
			return nil, nil, err
		}
	}

	teardown := func() {
		teardown(store, storePath)
	}

	return store, teardown, nil
}

func teardown(store *Store, storePath string) {
	err := store.Close()
	if err != nil {
		log.Fatalln(err)
	}

	err = os.RemoveAll(storePath)
	if err != nil {
		log.Fatalln(err)
	}
}
