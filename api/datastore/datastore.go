package datastore

import (
	"fmt"
	"io"
	"os"
	"path"
	"time"

	portainer "github.com/portainer/portainer/api"
	portainerErrors "github.com/portainer/portainer/api/dataservices/errors"
	"github.com/sirupsen/logrus"
)

func (store *Store) version() (int, error) {
	version, err := store.VersionService.DBVersion()
	if store.IsErrObjectNotFound(err) {
		version = 0
	}
	return version, err
}

func (store *Store) edition() portainer.SoftwareEdition {
	edition, err := store.VersionService.Edition()
	if store.IsErrObjectNotFound(err) {
		edition = portainer.PortainerCE
	}
	return edition
}

// NewStore initializes a new Store and the associated services
func NewStore(storePath string, fileService portainer.FileService, connection portainer.Connection) *Store {
	return &Store{
		fileService: fileService,
		connection:  connection,
	}
}

// Open opens and initializes the BoltDB database.
func (store *Store) Open() (newStore bool, err error) {
	newStore = true

	encryptionReq, err := store.connection.NeedsEncryptionMigration()
	if err != nil {
		return false, err
	}

	if encryptionReq {
		err = store.encryptDB()
		if err != nil {
			return false, err
		}
	}

	err = store.connection.Open()
	if err != nil {
		return newStore, err
	}

	err = store.initServices()
	if err != nil {
		return newStore, err
	}

	// if we have DBVersion in the database then ensure we flag this as NOT a new store
	version, err := store.VersionService.DBVersion()
	if err != nil {
		if store.IsErrObjectNotFound(err) {
			return newStore, nil
		}

		return newStore, err
	}

	if version > 0 {
		logrus.WithField("version", version).Infof("Opened existing store")
		return false, nil
	}

	return newStore, nil
}

func (store *Store) Close() error {
	return store.connection.Close()
}

// BackupTo backs up db to a provided writer.
// It does hot backup and doesn't block other database reads and writes
func (store *Store) BackupTo(w io.Writer) error {
	return store.connection.BackupTo(w)
}

// CheckCurrentEdition checks if current edition is community edition
func (store *Store) CheckCurrentEdition() error {
	if store.edition() != portainer.PortainerCE {
		return portainerErrors.ErrWrongDBEdition
	}
	return nil
}

// TODO: move the use of this to dataservices.IsErrObjectNotFound()?
func (store *Store) IsErrObjectNotFound(e error) bool {
	return e == portainerErrors.ErrObjectNotFound
}

func (store *Store) Rollback(force bool) error {
	return store.connectionRollback(force)
}

func (store *Store) encryptDB() error {
	store.connection.SetEncrypted(false)
	err := store.connection.Open()
	if err != nil {
		return err
	}

	err = store.initServices()
	if err != nil {
		return err
	}

	// The DB is not currently encrypted.  First save the encrypted db filename
	oldFilename := store.connection.GetDatabaseFilePath()
	logrus.Infof("Encrypting database")

	// export file path for backup
	exportFilename := path.Join(store.databasePath() + "." + fmt.Sprintf("backup-%d.json", time.Now().Unix()))

	logrus.Infof("Exporting database backup to %s", exportFilename)
	err = store.Export(exportFilename)
	if err != nil {
		logrus.WithError(err).Debugf("Failed to export to %s", exportFilename)
		return err
	}

	logrus.Infof("Database backup exported")

	// Close existing un-encrypted db so that we can delete the file later
	store.connection.Close()

	// Tell the db layer to create an encrypted db when opened
	store.connection.SetEncrypted(true)
	store.connection.Open()

	// We have to init services before import
	err = store.initServices()
	if err != nil {
		return err
	}

	err = store.Import(exportFilename)
	if err != nil {
		// Remove the new encrypted file that we failed to import
		os.Remove(store.connection.GetDatabaseFilePath())
		logrus.Fatal(portainerErrors.ErrDBImportFailed.Error())
	}

	err = os.Remove(oldFilename)
	if err != nil {
		logrus.Errorf("Failed to remove the un-encrypted db file")
	}

	err = os.Remove(exportFilename)
	if err != nil {
		logrus.Errorf("Failed to remove the json backup file")
	}

	// Close db connection
	store.connection.Close()

	logrus.Info("Database successfully encrypted")
	return nil
}
