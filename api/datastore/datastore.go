package datastore

import (
	"errors"
	"fmt"
	"os"
	"path"
	"time"

	portainer "github.com/portainer/portainer/api"
	portainerErrors "github.com/portainer/portainer/api/dataservices/errors"

	"github.com/rs/zerolog/log"
)

// NewStore initializes a new Store and the associated services
func NewStore(storePath string, fileService portainer.FileService, connection portainer.Connection) *Store {
	return &Store{
		fileService: fileService,
		connection:  connection,
	}
}

// Open opens and initializes the BoltDB database.
func (store *Store) Open() (newStore bool, err error) {
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
		return false, err
	}

	err = store.initServices()
	if err != nil {
		return false, err
	}

	// If no settings object exists then assume we have a new store
	_, err = store.SettingsService.Settings()
	if err != nil {
		if store.IsErrObjectNotFound(err) {
			return true, nil
		}
		return false, err
	}

	return false, nil
}

func (store *Store) Close() error {
	return store.connection.Close()
}

// CheckCurrentEdition checks if current edition is community edition
func (store *Store) CheckCurrentEdition() error {
	if store.edition() != portainer.Edition {
		return portainerErrors.ErrWrongDBEdition
	}
	return nil
}

func (store *Store) edition() portainer.SoftwareEdition {
	edition, err := store.VersionService.Edition()
	if store.IsErrObjectNotFound(err) {
		edition = portainer.PortainerCE
	}
	return edition
}

// TODO: move the use of this to dataservices.IsErrObjectNotFound()?
func (store *Store) IsErrObjectNotFound(e error) bool {
	return errors.Is(e, portainerErrors.ErrObjectNotFound)
}

func (store *Store) Connection() portainer.Connection {
	return store.connection
}

func (store *Store) Rollback(force bool) error {
	return nil
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
	log.Info().Msg("encrypting database")

	// export file path for backup
	exportFilename := path.Join(store.connection.GetDatabaseFilePath() + "." + fmt.Sprintf("backup-%d.json", time.Now().Unix()))

	log.Info().Str("filename", exportFilename).Msg("exporting database backup")

	err = store.Export(exportFilename)
	if err != nil {
		log.Error().Str("filename", exportFilename).Err(err).Msg("failed to export")

		return err
	}

	log.Info().Msg("database backup exported")

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

		log.Fatal().Err(portainerErrors.ErrDBImportFailed).Msg("")
	}

	err = os.Remove(oldFilename)
	if err != nil {
		log.Error().Msg("failed to remove the un-encrypted db file")
	}

	err = os.Remove(exportFilename)
	if err != nil {
		log.Error().Msg("failed to remove the json backup file")
	}

	// Close db connection
	store.connection.Close()

	log.Info().Msg("database successfully encrypted")

	return nil
}
