package datastore

import (
	"fmt"
	"os"
	"path"
	"testing"

	portainer "github.com/portainer/portainer/api"
)

func TestCreateBackupFolders(t *testing.T) {
	_, store, teardown := MustNewTestStore(false, true)
	defer teardown()

	connection := store.GetConnection()
	backupPath := path.Join(connection.GetStorePath(), backupDefaults.backupDir)

	if isFileExist(backupPath) {
		t.Error("Expect backups folder to not exist")
	}

	store.createBackupFolders()
	if !isFileExist(backupPath) {
		t.Error("Expect backups folder to exist")
	}
}

func TestStoreCreation(t *testing.T) {
	_, store, teardown := MustNewTestStore(true, true)
	defer teardown()

	if store == nil {
		t.Error("Expect to create a store")
	}

	if store.CheckCurrentEdition() != nil {
		t.Error("Expect to get CE Edition")
	}
}

func TestBackup(t *testing.T) {
	_, store, teardown := MustNewTestStore(true, true)
	connection := store.GetConnection()
	defer teardown()

	t.Run("Backup should create default db backup", func(t *testing.T) {
		store.VersionService.StoreDBVersion(portainer.DBVersion)
		store.backupWithOptions(nil)

		backupFileName := path.Join(connection.GetStorePath(), "backups", "common", fmt.Sprintf("portainer.edb.%03d.*", portainer.DBVersion))
		if !isFileExist(backupFileName) {
			t.Errorf("Expect backup file to be created %s", backupFileName)
		}
	})

	t.Run("BackupWithOption should create a name specific backup at common path", func(t *testing.T) {
		store.backupWithOptions(&BackupOptions{
			BackupFileName: beforePortainerVersionUpgradeBackup,
			BackupDir:      store.commonBackupDir(),
		})
		backupFileName := path.Join(connection.GetStorePath(), "backups", "common", beforePortainerVersionUpgradeBackup)
		if !isFileExist(backupFileName) {
			t.Errorf("Expect backup file to be created %s", backupFileName)
		}
	})
}

func TestRemoveWithOptions(t *testing.T) {
	_, store, teardown := MustNewTestStore(true, true)
	defer teardown()

	t.Run("successfully removes file if existent", func(t *testing.T) {
		store.createBackupFolders()
		options := &BackupOptions{
			BackupDir:      store.commonBackupDir(),
			BackupFileName: "test.txt",
		}

		filePath := path.Join(options.BackupDir, options.BackupFileName)
		f, err := os.Create(filePath)
		if err != nil {
			t.Fatalf("file should be created; err=%s", err)
		}
		f.Close()

		err = store.removeWithOptions(options)
		if err != nil {
			t.Errorf("RemoveWithOptions should successfully remove file; err=%v", err)
		}

		if isFileExist(f.Name()) {
			t.Errorf("RemoveWithOptions should successfully remove file; file=%s", f.Name())
		}
	})

	t.Run("fails to removes file if non-existent", func(t *testing.T) {
		options := &BackupOptions{
			BackupDir:      store.commonBackupDir(),
			BackupFileName: "test.txt",
		}

		err := store.removeWithOptions(options)
		if err == nil {
			t.Error("RemoveWithOptions should fail for non-existent file")
		}
	})
}
