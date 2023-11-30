package datastore

import (
	"os"
	"path"

	"github.com/rs/zerolog/log"
)

func (store *Store) Backup() (string, error) {
	if err := store.createBackupPath(); err != nil {
		return "", err
	}

	backupFilename := store.backupFilename()
	log.Info().Str("from", store.connection.GetDatabaseFilePath()).Str("to", backupFilename).Msgf("Backing up database")
	err := store.fileService.Copy(store.connection.GetDatabaseFilePath(), backupFilename, true)
	if err != nil {
		log.Warn().Err(err).Msg("failed to create backup file")
		return "", err
	}

	return backupFilename, nil
}

func (store *Store) Restore() error {
	backupFilename := store.backupFilename()
	return store.RestoreFromFile(backupFilename)
}

func (store *Store) RestoreFromFile(backupFilename string) error {
	if exists, _ := store.fileService.FileExists(backupFilename); !exists {
		log.Error().Str("backupFilename", backupFilename).Msg("backup file does not exist")
		return os.ErrNotExist
	}

	if err := store.fileService.Copy(backupFilename, store.connection.GetDatabaseFilePath(), true); err != nil {
		log.Error().Err(err).Msg("error while restoring backup.")
		return err
	}

	log.Info().Str("from", store.connection.GetDatabaseFilePath()).Str("to", backupFilename).Msgf("database restored")

	// determine the db version
	store.Open()
	version, err := store.VersionService.Version()

	edition := "CE"
	if version.Edition == 2 {
		edition = "EE"
	}

	if err == nil {
		log.Info().Str("version", version.SchemaVersion).Msgf("Restored database version: Portainer %s %s", edition, version.SchemaVersion)
	}

	return nil
}

func (store *Store) createBackupPath() error {
	backupDir := path.Join(store.connection.GetStorePath(), "backups")
	if exists, _ := store.fileService.FileExists(backupDir); !exists {
		if err := os.MkdirAll(backupDir, 0700); err != nil {
			log.Error().Err(err).Msg("error while creating backup folder")
			return err
		}
	}
	return nil
}

func (store *Store) backupFilename() string {
	return path.Join(store.connection.GetStorePath(), "backups", store.connection.GetDatabaseFileName()+".bak")
}

func (store *Store) databasePath() string {
	return store.connection.GetDatabaseFilePath()
}
