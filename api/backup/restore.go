package backup

import (
	"context"
	"io"
	"os"
	"path/filepath"
	"time"

	"github.com/pkg/errors"
	"github.com/portainer/portainer/api/archive"
	"github.com/portainer/portainer/api/crypto"
	"github.com/portainer/portainer/api/database/boltdb"
	"github.com/portainer/portainer/api/dataservices"
	"github.com/portainer/portainer/api/filesystem"
	"github.com/portainer/portainer/api/http/offlinegate"
)

var filesToRestore = append(filesToBackup, "portainer.db")

// Restores system state from backup archive, will trigger system shutdown, when finished.
func RestoreArchive(archive io.Reader, password string, filestorePath string, gate *offlinegate.OfflineGate, datastore dataservices.DataStore, shutdownTrigger context.CancelFunc) error {
	var err error
	if password != "" {
		archive, err = decrypt(archive, password)
		if err != nil {
			return errors.Wrap(err, "failed to decrypt the archive")
		}
	}

	restorePath := filepath.Join(filestorePath, "restore", time.Now().Format("20060102150405"))
	defer os.RemoveAll(filepath.Dir(restorePath))

	err = extractArchive(archive, restorePath)
	if err != nil {
		return errors.Wrap(err, "cannot extract files from the archive. Please ensure the password is correct and try again")
	}

	unlock := gate.Lock()
	defer unlock()

	if err = datastore.Close(); err != nil {
		return errors.Wrap(err, "Failed to stop db")
	}

	if err = restoreFiles(restorePath, filestorePath); err != nil {
		return errors.Wrap(err, "failed to restore the system state")
	}

	shutdownTrigger()
	return nil
}

func decrypt(r io.Reader, password string) (io.Reader, error) {
	return crypto.AesDecrypt(r, []byte(password))
}

func extractArchive(r io.Reader, destinationDirPath string) error {
	return archive.ExtractTarGz(r, destinationDirPath)
}

func restoreFiles(srcDir string, destinationDir string) error {
	for _, filename := range filesToRestore {
		err := filesystem.CopyPath(filepath.Join(srcDir, filename), destinationDir)
		if err != nil {
			return err
		}
	}

	// TODO:  This is very boltdb module specific once again due to the filename.  Move to bolt module? Refactor for another day

	// Prevent the possibility of having both databases.  Remove any default new instance
	os.Remove(filepath.Join(destinationDir, boltdb.DatabaseFileName))
	os.Remove(filepath.Join(destinationDir, boltdb.EncryptedDatabaseFileName))

	// Now copy the database.  It'll be either portainer.db or portainer.edb

	// Note: CopyPath does not return an error if the source file doesn't exist
	err := filesystem.CopyPath(filepath.Join(srcDir, boltdb.EncryptedDatabaseFileName), destinationDir)
	if err != nil {
		return err
	}

	return filesystem.CopyPath(filepath.Join(srcDir, boltdb.DatabaseFileName), destinationDir)
}
