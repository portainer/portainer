package bolt

import (
	"fmt"
	"log"
	"math/rand"
	"os"
	"path"
	"path/filepath"
	"testing"
	"time"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/filesystem"
)

var (
	dataStorePath  string
	testBackupPath string
)

func init() {
	rand.Seed(time.Now().UnixNano())
	databaseFileName = fmt.Sprintf("portainer-%08d.db", rand.Intn(100000000))

	pwd, err := os.Getwd()
	if err != nil {
		log.Println(err)
	}

	dataStorePath = path.Join(pwd, "tmp")
	testBackupPath = path.Join(dataStorePath, "backups")

	teardown()
}

func NewTestStore(edition portainer.SoftwareEdition, version int, init bool) *Store {
	fileService, err := filesystem.NewService(dataStorePath, "")
	if err != nil {
		log.Fatal(err)
	}

	store, err := NewStore(dataStorePath, fileService)
	if err != nil {
		log.Fatal(err)
	}

	err = store.Open()
	if err != nil {
		log.Fatal(err)
	}

	if init {
		err = store.Init()
		if err != nil {
			log.Fatal(err)
		}
	}

	err = store.VersionService.StoreEdition(edition)
	if err != nil {
		log.Fatal(err)
	}

	err = store.VersionService.StoreDBVersion(version)
	if err != nil {
		log.Fatal(err)
	}

	return store
}

func teardown() {
	err := os.RemoveAll(testBackupPath)
	if err != nil {
		log.Fatalln(err)
	}

	files, err := filepath.Glob(path.Join(dataStorePath, "portainer-*.*"))
	if err != nil {
		log.Fatalln(err)
	}
	for _, f := range files {
		if err := os.Remove(f); err != nil {
			log.Fatalln(err)
		}
	}
}

func isFileExist(path string) bool {
	matches, err := filepath.Glob(path)
	if err != nil {
		return false
	}
	return len(matches) > 0
}

func updateVersion(store *Store, v int) {
	err := store.VersionService.StoreDBVersion(v)
	if err != nil {
		log.Fatal(err)
	}
}

func testVersion(store *Store, versionWant int, t *testing.T) {
	if v, _ := store.version(); v != versionWant {
		t.Errorf("Expect store version to be %d but was %d", versionWant, v)
	}
}

func testEdition(store *Store, editionWant portainer.SoftwareEdition, t *testing.T) {
	if e := store.edition(); e != editionWant {
		t.Errorf("Expect store edition to be %s but was %s", editionWant.GetEditionLabel(), e.GetEditionLabel())
	}
}
