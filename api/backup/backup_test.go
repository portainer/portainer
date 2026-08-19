package backup

import (
	"bytes"
	"context"
	"io"
	"os"
	"path/filepath"
	"testing"

	"github.com/portainer/portainer/api/archive"
	"github.com/portainer/portainer/api/crypto"
	"github.com/portainer/portainer/api/datastore"
	"github.com/portainer/portainer/api/filesystem"
	"github.com/portainer/portainer/api/http/offlinegate"
	"github.com/portainer/portainer/pkg/fips"

	"github.com/stretchr/testify/require"
)

func init() {
	fips.InitFIPS(false)
}

func TestGetRestoreSourcePath_DBAtRoot(t *testing.T) {
	t.Parallel()

	dir := t.TempDir()
	err := os.WriteFile(filesystem.JoinPaths(dir, "portainer.db"), []byte("db"), 0o600)
	require.NoError(t, err)

	result, err := getRestoreSourcePath(dir)
	require.NoError(t, err)
	require.Equal(t, dir, result)
}

func TestGetRestoreSourcePath_EncryptedDBAtRoot(t *testing.T) {
	t.Parallel()

	dir := t.TempDir()
	err := os.WriteFile(filesystem.JoinPaths(dir, "portainer.edb"), []byte("db"), 0o600)
	require.NoError(t, err)

	result, err := getRestoreSourcePath(dir)
	require.NoError(t, err)
	require.Equal(t, dir, result)
}

func TestGetRestoreSourcePath_DBInSubdirectory(t *testing.T) {
	t.Parallel()

	dir := t.TempDir()
	sub := filesystem.JoinPaths(dir, "backup-2024-01-01")
	err := os.Mkdir(sub, 0o700)
	require.NoError(t, err)

	err = os.WriteFile(filesystem.JoinPaths(sub, "portainer.db"), []byte("db"), 0o600)
	require.NoError(t, err)

	result, err := getRestoreSourcePath(dir)
	require.NoError(t, err)
	require.Equal(t, sub, result)
}

func TestGetRestoreSourcePath_NoDBFile(t *testing.T) {
	t.Parallel()

	dir := t.TempDir()
	err := os.WriteFile(filesystem.JoinPaths(dir, "other.file"), []byte("data"), 0o600)
	require.NoError(t, err)

	result, err := getRestoreSourcePath(dir)
	require.NoError(t, err)
	require.Equal(t, dir, result)
}

func TestGetRestoreSourcePath_EmptyDir(t *testing.T) {
	t.Parallel()

	dir := t.TempDir()

	result, err := getRestoreSourcePath(dir)
	require.NoError(t, err)
	require.Equal(t, dir, result)
}

func TestEncryptDecrypt_RoundTrip(t *testing.T) {
	t.Parallel()

	dir := t.TempDir()
	plaintext := []byte("sensitive portainer backup data")

	srcPath := filesystem.JoinPaths(dir, "archive.tar.gz")
	err := os.WriteFile(srcPath, plaintext, 0o600)
	require.NoError(t, err)

	encryptedPath, err := encrypt(srcPath, "mysecretpassword")
	require.NoError(t, err)
	require.Equal(t, srcPath+".encrypted", encryptedPath)

	encryptedData, err := os.ReadFile(encryptedPath)
	require.NoError(t, err)

	decryptedReader, err := crypto.AesDecrypt(bytes.NewReader(encryptedData), []byte("mysecretpassword"))
	require.NoError(t, err)

	decrypted, err := io.ReadAll(decryptedReader)
	require.NoError(t, err)
	require.Equal(t, plaintext, decrypted)
}

func TestEncryptDecrypt_WrongPassword(t *testing.T) {
	t.Parallel()

	dir := t.TempDir()

	srcPath := filesystem.JoinPaths(dir, "archive.tar.gz")
	err := os.WriteFile(srcPath, []byte("data"), 0o600)
	require.NoError(t, err)

	encryptedPath, err := encrypt(srcPath, "correctpassword")
	require.NoError(t, err)

	encryptedData, err := os.ReadFile(encryptedPath)
	require.NoError(t, err)

	_, err = crypto.AesDecrypt(bytes.NewReader(encryptedData), []byte("wrongpassword"))
	require.Error(t, err)
}

func TestCreateBackupArchive_NoPassword(t *testing.T) {
	t.Parallel()

	_, store := datastore.MustNewTestStore(t, true, false)
	storePath := store.GetConnection().GetStorePath()
	gate := offlinegate.NewOfflineGate()

	archivePath, err := CreateBackupArchive("", gate, store, storePath)
	require.NoError(t, err)

	f, err := os.Open(archivePath)
	require.NoError(t, err)
	t.Cleanup(func() {
		err := f.Close()
		require.NoError(t, err)
	})

	extractDir := t.TempDir()
	err = archive.ExtractTarGz(f, extractDir)
	require.NoError(t, err)

	dbFound := false
	err = filepath.Walk(extractDir, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}
		if info.Name() == "portainer.db" {
			dbFound = true
		}

		return nil
	})
	require.NoError(t, err)
	require.True(t, dbFound, "archive should contain portainer.db")
}

func TestCreateBackupArchive_WithPassword(t *testing.T) {
	t.Parallel()

	_, store := datastore.MustNewTestStore(t, true, false)
	storePath := store.GetConnection().GetStorePath()
	gate := offlinegate.NewOfflineGate()

	archivePath, err := CreateBackupArchive("backup-secret", gate, store, storePath)
	require.NoError(t, err)
	require.Contains(t, archivePath, ".encrypted")

	encryptedData, err := os.ReadFile(archivePath)
	require.NoError(t, err)

	decryptedReader, err := crypto.AesDecrypt(bytes.NewReader(encryptedData), []byte("backup-secret"))
	require.NoError(t, err)

	extractDir := t.TempDir()
	err = archive.ExtractTarGz(decryptedReader, extractDir)
	require.NoError(t, err)

	dbFound := false
	err = filepath.Walk(extractDir, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}
		if info.Name() == "portainer.db" {
			dbFound = true
		}

		return nil
	})
	require.NoError(t, err)
	require.True(t, dbFound, "decrypted archive should contain portainer.db")
}

func TestRestoreArchive_NoPassword(t *testing.T) {
	t.Parallel()

	_, store1 := datastore.MustNewTestStore(t, true, false)
	storePath1 := store1.GetConnection().GetStorePath()
	gate := offlinegate.NewOfflineGate()

	archivePath, err := CreateBackupArchive("", gate, store1, storePath1)
	require.NoError(t, err)

	archiveData, err := os.ReadFile(archivePath)
	require.NoError(t, err)

	_, store2 := datastore.MustNewTestStore(t, true, false)
	storePath2 := store2.GetConnection().GetStorePath()

	ctx, cancel := context.WithCancel(t.Context())
	err = RestoreArchive(bytes.NewReader(archiveData), "", storePath2, gate, store2, cancel)
	require.NoError(t, err)

	require.ErrorIs(t, ctx.Err(), context.Canceled)

	_, err = os.Stat(filesystem.JoinPaths(storePath2, "portainer.db"))
	require.NoError(t, err)
}

func TestRestoreArchive_WithPassword(t *testing.T) {
	t.Parallel()

	_, store1 := datastore.MustNewTestStore(t, true, false)
	storePath1 := store1.GetConnection().GetStorePath()
	gate := offlinegate.NewOfflineGate()

	archivePath, err := CreateBackupArchive("restore-secret", gate, store1, storePath1)
	require.NoError(t, err)

	archiveData, err := os.ReadFile(archivePath)
	require.NoError(t, err)

	_, store2 := datastore.MustNewTestStore(t, true, false)
	storePath2 := store2.GetConnection().GetStorePath()

	ctx, cancel := context.WithCancel(t.Context())
	err = RestoreArchive(bytes.NewReader(archiveData), "restore-secret", storePath2, gate, store2, cancel)
	require.NoError(t, err)

	require.ErrorIs(t, ctx.Err(), context.Canceled)

	_, err = os.Stat(filesystem.JoinPaths(storePath2, "portainer.db"))
	require.NoError(t, err)
}

func TestRestoreArchive_WrongPassword(t *testing.T) {
	t.Parallel()

	_, store1 := datastore.MustNewTestStore(t, true, false)
	storePath1 := store1.GetConnection().GetStorePath()
	gate := offlinegate.NewOfflineGate()

	archivePath, err := CreateBackupArchive("correct-password", gate, store1, storePath1)
	require.NoError(t, err)

	archiveData, err := os.ReadFile(archivePath)
	require.NoError(t, err)

	_, store2 := datastore.MustNewTestStore(t, true, false)
	storePath2 := store2.GetConnection().GetStorePath()

	_, cancel := context.WithCancel(t.Context())
	err = RestoreArchive(bytes.NewReader(archiveData), "wrong-password", storePath2, gate, store2, cancel)
	require.Error(t, err)
}
