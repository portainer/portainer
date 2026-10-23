package datastore

import (
	"os"
	"testing"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/database/boltdb"
	"github.com/portainer/portainer/api/database/models"
	"github.com/stretchr/testify/require"

	"github.com/rs/zerolog/log"
)

func TestStoreCreation(t *testing.T) {
	t.Parallel()
	_, store := MustNewTestStore(t, true, true)
	require.NotNil(t, store)

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
	t.Parallel()
	_, store := MustNewTestStore(t, true, true)
	backupFileName := store.backupFilename()
	t.Run("Backup should create "+backupFileName, func(t *testing.T) {
		v := models.Version{
			Edition:       int(portainer.PortainerCE),
			SchemaVersion: portainer.APIVersion,
		}

		err := store.VersionService.UpdateVersion(&v)
		require.NoError(t, err)

		_, err = store.Backup("")
		require.NoError(t, err)

		if !isFileExist(backupFileName) {
			t.Errorf("Expect backup file to be created %s", backupFileName)
		}
	})
}

func TestRestore(t *testing.T) {
	t.Parallel()
	_, store := MustNewTestStore(t, true, false)

	t.Run("Basic Restore", func(t *testing.T) {
		// override and set initial db version and edition
		updateEdition(store, portainer.PortainerCE)
		updateVersion(store, "2.4")

		_, err := store.Backup("")
		require.NoError(t, err)

		updateVersion(store, "2.16")
		testVersion(store, "2.16", t)

		err = store.Restore()
		require.NoError(t, err)

		// check if the restore is successful and the version is correct
		testVersion(store, "2.4", t)
	})

	t.Run("Basic Restore After Multiple Backups", func(t *testing.T) {
		// override and set initial db version and edition
		updateEdition(store, portainer.PortainerCE)
		updateVersion(store, "2.4")

		_, err := store.Backup("")
		require.NoError(t, err)

		updateVersion(store, "2.14")
		updateVersion(store, "2.16")
		testVersion(store, "2.16", t)

		err = store.Restore()
		require.NoError(t, err)

		// check if the restore is successful and the version is correct
		testVersion(store, "2.4", t)
	})
}

func TestBackupDBFile(t *testing.T) {
	t.Parallel()
	_, store := MustNewTestStore(t, true, false)

	t.Run("creates backup file without managing connection state", func(t *testing.T) {
		// Verify connection is usable before
		_, err := store.VersionService.Version()
		require.NoError(t, err, "connection should be usable before backupDBFile")

		// backupDBFile should work without closing the connection
		backupFilename, err := store.backupDBFile("")
		require.NoError(t, err)
		require.FileExists(t, backupFilename)

		// Verify connection is still usable after (not closed/reopened)
		_, err = store.VersionService.Version()
		require.NoError(t, err, "connection should still be usable after backupDBFile")

		require.NoError(t, os.Remove(backupFilename))
	})

	t.Run("uses custom path when provided", func(t *testing.T) {
		customPath := t.TempDir() + "/custom-backup.db"
		backupFilename, err := store.backupDBFile(customPath)
		require.NoError(t, err)
		require.Equal(t, customPath, backupFilename)
		require.FileExists(t, backupFilename)
	})
}

func TestBackupDBFileUsesCorrectPath(t *testing.T) {
	t.Parallel()
	_, store := MustNewTestStore(t, true, false)

	t.Run("backs up unencrypted db when encrypted flag is false", func(t *testing.T) {
		err := store.connection.SetEncrypted(false)
		require.NoError(t, err)

		backupFilename, err := store.backupDBFile("")
		require.NoError(t, err)
		require.FileExists(t, backupFilename)

		// Verify it backed up the unencrypted file (portainer.db)
		require.Contains(t, backupFilename, boltdb.DatabaseFileName)
		require.NotContains(t, backupFilename, boltdb.EncryptedDatabaseFileName)

		require.NoError(t, os.Remove(backupFilename))
	})
}
