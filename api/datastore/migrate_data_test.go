package datastore

import (
	"fmt"
	"log"
	"path/filepath"
	"strings"
	"testing"

	portainer "github.com/portainer/portainer/api"
)

// testVersion is a helper which tests current store version against wanted version
func testVersion(store *Store, versionWant int, t *testing.T) {
	v, err := store.VersionService.DBVersion()
	if err != nil {
		t.Errorf("Expect store version to be %d but was %d with error: %s", versionWant, v, err)
	}
	if v != versionWant {
		t.Errorf("Expect store version to be %d but was %d", versionWant, v)
	}
}

func TestMigrateData(t *testing.T) {
	t.Run("MigrateData for New Store & Re-Open Check", func(t *testing.T) {
		newStore, store, teardown := MustNewTestStore(false)
		defer teardown()

		if !newStore {
			t.Error("Expect a new DB")
		}

		// not called for new stores
		//store.MigrateData()

		testVersion(store, portainer.DBVersion, t)
		store.Close()

		newStore, _ = store.Open()
		if newStore {
			t.Error("Expect store to NOT be new DB")
		}
	})

	tests := []struct {
		version         int
		expectedVersion int
	}{
		{version: 17, expectedVersion: portainer.DBVersion},
		{version: 21, expectedVersion: portainer.DBVersion},
	}
	for _, tc := range tests {
		_, store, teardown := MustNewTestStore(true)
		defer teardown()

		// Setup data
		store.VersionService.StoreDBVersion(tc.version)

		// Required roles by migrations 22.2
		store.RoleService.Create(&portainer.Role{ID: 1})
		store.RoleService.Create(&portainer.Role{ID: 2})
		store.RoleService.Create(&portainer.Role{ID: 3})
		store.RoleService.Create(&portainer.Role{ID: 4})

		t.Run(fmt.Sprintf("MigrateData for version %d", tc.version), func(t *testing.T) {
			store.MigrateData()
			testVersion(store, tc.expectedVersion, t)
		})

		t.Run(fmt.Sprintf("Restoring DB after migrateData for version %d", tc.version), func(t *testing.T) {
			store.Rollback(true)
			store.Open()
			testVersion(store, tc.version, t)
		})
	}

	t.Run("Error in MigrateData should restore backup before MigrateData", func(t *testing.T) {
		_, store, teardown := MustNewTestStore(false)
		defer teardown()

		version := 17
		store.VersionService.StoreDBVersion(version)

		store.MigrateData()

		testVersion(store, version, t)
	})

	t.Run("MigrateData should create backup file upon update", func(t *testing.T) {
		_, store, teardown := MustNewTestStore(false)
		defer teardown()
		store.VersionService.StoreDBVersion(0)

		store.MigrateData()

		options := store.setupOptions(getBackupRestoreOptions(store.commonBackupDir()))

		if !isFileExist(options.BackupPath) {
			t.Errorf("Backup file should exist; file=%s", options.BackupPath)
		}
	})

	t.Run("MigrateData should fail to create backup if database file is set to updating", func(t *testing.T) {
		_, store, teardown := MustNewTestStore(false)
		defer teardown()

		store.VersionService.StoreIsUpdating(true)

		store.MigrateData()

		options := store.setupOptions(getBackupRestoreOptions(store.commonBackupDir()))

		if isFileExist(options.BackupPath) {
			t.Errorf("Backup file should not exist for dirty database; file=%s", options.BackupPath)
		}
	})

	t.Run("MigrateData should not create backup on startup if portainer version matches db", func(t *testing.T) {
		_, store, teardown := MustNewTestStore(false)
		defer teardown()

		store.MigrateData()

		options := store.setupOptions(getBackupRestoreOptions(store.commonBackupDir()))

		if isFileExist(options.BackupPath) {
			t.Errorf("Backup file should not exist for dirty database; file=%s", options.BackupPath)
		}
	})

}

func Test_getBackupRestoreOptions(t *testing.T) {
	_, store, teardown := MustNewTestStore(false)
	defer teardown()

	options := getBackupRestoreOptions(store.commonBackupDir())

	wantDir := store.commonBackupDir()
	if !strings.HasSuffix(options.BackupDir, wantDir) {
		log.Fatalf("incorrect backup dir; got=%s, want=%s", options.BackupDir, wantDir)
	}

	wantFilename := "portainer.db.bak"
	if options.BackupFileName != wantFilename {
		log.Fatalf("incorrect backup file; got=%s, want=%s", options.BackupFileName, wantFilename)
	}
}

func TestRollback(t *testing.T) {
	t.Run("Rollback should restore upgrade after backup", func(t *testing.T) {
		version := 21
		_, store, teardown := MustNewTestStore(false)
		defer teardown()
		store.VersionService.StoreDBVersion(version)

		_, err := store.backupWithOptions(getBackupRestoreOptions(store.commonBackupDir()))
		if err != nil {
			log.Fatal(err)
		}

		// Change the current edition
		err = store.VersionService.StoreDBVersion(version + 10)
		if err != nil {
			log.Fatal(err)
		}

		err = store.Rollback(true)
		if err != nil {
			t.Logf("Rollback failed: %s", err)
			t.Fail()
			return
		}

		store.Open()
		testVersion(store, version, t)
	})
}

// isFileExist is helper function to check for file existence
func isFileExist(path string) bool {
	matches, err := filepath.Glob(path)
	if err != nil {
		return false
	}
	return len(matches) > 0
}
