package datastore

import (
	"testing"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/database/models"

	"github.com/rs/zerolog/log"
)

func TestStoreCreation(t *testing.T) {
	_, store := MustNewTestStore(t, true, true)
	if store == nil {
		t.Fatal("Expect to create a store")
	}

	v, err := store.VersionService.Version()
	if err != nil {
		log.Fatal().Err(err).Msg("")
	}

	if portainer.SoftwareEdition(v.Edition) != portainer.PortainerCE {
		t.Error("Expect to get CE Edition")
	}

	if v.SchemaVersion != portainer.APIVersion {
		t.Error("Expect to get APIVersion")
	}
}

func TestBackup(t *testing.T) {
	_, store := MustNewTestStore(t, true, true)
	backupFileName := store.backupFilename()
	t.Run("Backup should create "+backupFileName, func(t *testing.T) {
		v := models.Version{
			Edition:       int(portainer.PortainerCE),
			SchemaVersion: portainer.APIVersion,
		}
		store.VersionService.UpdateVersion(&v)
		store.Backup("")

		if !isFileExist(backupFileName) {
			t.Errorf("Expect backup file to be created %s", backupFileName)
		}
	})
}

func TestRestore(t *testing.T) {
	_, store := MustNewTestStore(t, true, false)

	t.Run("Basic Restore", func(t *testing.T) {
		// override and set initial db version and edition
		updateEdition(store, portainer.PortainerCE)
		updateVersion(store, "2.4")

		store.Backup("")
		updateVersion(store, "2.16")
		testVersion(store, "2.16", t)
		store.Restore()

		// check if the restore is successful and the version is correct
		testVersion(store, "2.4", t)
	})

	t.Run("Basic Restore After Multiple Backups", func(t *testing.T) {
		// override and set initial db version and edition
		updateEdition(store, portainer.PortainerCE)
		updateVersion(store, "2.4")
		store.Backup("")
		updateVersion(store, "2.14")
		updateVersion(store, "2.16")
		testVersion(store, "2.16", t)
		store.Restore()

		// check if the restore is successful and the version is correct
		testVersion(store, "2.4", t)
	})
}
