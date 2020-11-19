package bolt

import (
	"fmt"
	"log"
	"testing"

	portainer "github.com/portainer/portainer/api"
)

func TestCreateBackupFolders(t *testing.T) {
	store := NewTestStore(portainer.PortainerEE, portainer.DBVersionEE, false)
	if exists, _ := store.fileService.FileExists("tmp/backups"); exists {
		t.Error("Expect backups folder to not exist")
	}
	store.createBackupFolders()
	if exists, _ := store.fileService.FileExists("tmp/backups"); !exists {
		t.Error("Expect backups folder to exist")
	}
	store.createBackupFolders()
	store.Close()
	teardown()
}

func TestStoreCreation(t *testing.T) {
	store := NewTestStore(portainer.PortainerEE, portainer.DBVersionEE, false)
	if store == nil {
		t.Error("Expect to create a store")
	}

	if store.edition() != portainer.PortainerEE {
		t.Error("Expect to get EE Edition")
	}

	version, err := store.version()
	if err != nil {
		log.Fatal(err)
	}

	if version != portainer.DBVersionEE {
		t.Error("Expect to get EE DBVersion")
	}

	store.Close()
	teardown()
}

func TestBackup(t *testing.T) {

	tests := []struct {
		edition portainer.SoftwareEdition
		version int
	}{
		{edition: portainer.PortainerCE, version: portainer.DBVersion},
		{edition: portainer.PortainerEE, version: portainer.DBVersionEE},
	}

	for _, tc := range tests {
		backupFileName := fmt.Sprintf("tmp/backups/%s/portainer.db.%03d.*", tc.edition.GetEditionLabel(), tc.version)
		t.Run(fmt.Sprintf("Backup should create %s", backupFileName), func(t *testing.T) {
			store := NewTestStore(tc.edition, tc.version, false)
			store.Backup()

			if !isFileExist(backupFileName) {
				t.Errorf("Expect backup file to be created %s", backupFileName)
			}
			store.Close()
		})
	}
	t.Run("BackupWithOption should create a name specific backup", func(t *testing.T) {
		edition := portainer.PortainerCE
		version := portainer.DBVersion
		store := NewTestStore(edition, version, false)
		store.BackupWithOptions(&BackupOptions{
			BackupFileName: beforePortainerUpgradeToEEBackup,
			Edition:        portainer.PortainerCE,
		})
		backupFileName := fmt.Sprintf("tmp/backups/%s/%s", edition.GetEditionLabel(), beforePortainerUpgradeToEEBackup)
		if !isFileExist(backupFileName) {
			t.Errorf("Expect backup file to be created %s", backupFileName)
		}
		store.Close()
	})

	teardown()
}

// TODO restore / backup failed test cases
func TestRestore(t *testing.T) {

	editions := []portainer.SoftwareEdition{portainer.PortainerCE, portainer.PortainerEE}
	var currentVersion = 0

	for i, e := range editions {
		editionLabel := e.GetEditionLabel()
		currentVersion = 10 ^ i + 1
		store := NewTestStore(e, currentVersion, false)
		t.Run(fmt.Sprintf("Basic Restore for %s", editionLabel), func(t *testing.T) {
			store.Backup()
			updateVersion(store, currentVersion+1)
			testVersion(store, currentVersion+1, t)
			store.Restore()
			testVersion(store, currentVersion, t)
		})
		t.Run(fmt.Sprintf("Basic Restore After Multiple Backup for %s", editionLabel), func(t *testing.T) {
			currentVersion = currentVersion + 5
			updateVersion(store, currentVersion)
			store.Backup()
			updateVersion(store, currentVersion+2)
			testVersion(store, currentVersion+2, t)
			store.Restore()
			testVersion(store, currentVersion, t)
		})
		store.Close()
	}

	teardown()
}
