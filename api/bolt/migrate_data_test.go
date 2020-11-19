package bolt

import (
	"fmt"
	"log"
	"testing"

	"github.com/boltdb/bolt"
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/filesystem"
)

// New Database should be EE and DBVersion
//

func TestMigrateData(t *testing.T) {
	var store *Store

	t.Run("MigrateData for New Store", func(t *testing.T) {
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

		err = store.Init()
		if err != nil {
			log.Fatal(err)
		}

		store.MigrateData()

		testVersion(store, portainer.DBVersionEE, t)
		testEdition(store, portainer.PortainerEE, t)

		store.Close()
	})

	tests := []struct {
		edition         portainer.SoftwareEdition
		version         int
		expectedVersion int
	}{
		{edition: portainer.PortainerCE, version: 5, expectedVersion: portainer.DBVersionEE},
		{edition: portainer.PortainerCE, version: 21, expectedVersion: portainer.DBVersionEE},
	}

	for _, tc := range tests {
		store = NewTestStore(tc.edition, tc.version, true)
		t.Run(fmt.Sprintf("MigrateData for %s version %d", tc.edition.GetEditionLabel(), tc.version), func(t *testing.T) {
			store.MigrateData()
			testVersion(store, tc.expectedVersion, t)
			testEdition(store, portainer.PortainerEE, t)
		})

		t.Run(fmt.Sprintf("Restoring DB after migrateData for %s version %d", tc.edition.GetEditionLabel(), tc.version), func(t *testing.T) {
			store.RollbackToCE()
			testVersion(store, tc.version, t)
			testEdition(store, tc.edition, t)
		})

		store.Close()
	}

	t.Run("Error in MigrateData should restore backup before MigrateData", func(t *testing.T) {
		version := 21
		store = NewTestStore(portainer.PortainerCE, version, true)

		deleteBucket(store.db, "settings")
		store.MigrateData()

		testVersion(store, version, t)
		testEdition(store, portainer.PortainerCE, t)

		store.Close()
	})

	teardown()
}

func deleteBucket(db *bolt.DB, bucketName string) {
	db.Update(func(tx *bolt.Tx) error {
		log.Printf("Delete bucket %s\n", bucketName)
		err := tx.DeleteBucket([]byte(bucketName))
		if err != nil {
			log.Println(err)
		}
		return err
	})
}
