package datastore

import (
	"fmt"
	"os"
	"path"

	portainer "github.com/portainer/portainer/api"
	"github.com/rs/zerolog/log"
)

func (store *Store) Backup() (string, error) {
	if err := store.createBackupPath(); err != nil {
		return "", err
	}

	backupFilename := store.backupFilename()
	log.Info().Str("from", store.connection.GetDatabaseFilePath()).Str("to", backupFilename).Msgf("Backing up database")

	// Close the store before backing up
	err := store.Close()
	if err != nil {
		return "", fmt.Errorf("failed to close store before backup: %w", err)
	}

	err = store.fileService.Copy(store.connection.GetDatabaseFilePath(), backupFilename, true)
	if err != nil {
		return "", fmt.Errorf("failed to create backup file: %w", err)
	}

	// reopen the store
	_, err = store.Open()
	if err != nil {
		return "", fmt.Errorf("failed to reopen store after backup: %w", err)
	}

	return backupFilename, nil
}

func (store *Store) Restore() error {
	backupFilename := store.backupFilename()
	return store.RestoreFromFile(backupFilename)
}

func (store *Store) RestoreFromFile(backupFilename string) error {
	if err := store.fileService.Copy(backupFilename, store.connection.GetDatabaseFilePath(), true); err != nil {
		return fmt.Errorf("unable to restore backup file %q. err: %w", backupFilename, err)
	}

	log.Info().Str("from", store.connection.GetDatabaseFilePath()).Str("to", backupFilename).Msgf("database restored")

	_, err := store.Open()
	if err != nil {
		return fmt.Errorf("unable to determine version of restored portainer backup file: %w", err)
	}

	// determine the db version
	version, err := store.VersionService.Version()
	if err != nil {
		return fmt.Errorf("unable to determine restored database version. err: %w", err)
	}

	editionLabel := portainer.SoftwareEdition(version.Edition).GetEditionLabel()
	log.Info().Str("version", version.SchemaVersion).Msgf("Restored database version: Portainer %s %s ", editionLabel, version.SchemaVersion)
	return nil
}

func (store *Store) createBackupPath() error {
	backupDir := path.Join(store.connection.GetStorePath(), "backups")
	if exists, _ := store.fileService.FileExists(backupDir); !exists {
		if err := os.MkdirAll(backupDir, 0700); err != nil {
			return fmt.Errorf("unable to create backup folder: %w", err)
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
