package datastore

import (
	"fmt"
	"os"
	"path"

	portainer "github.com/portainer/portainer/api"
	"github.com/rs/zerolog/log"
)

// Backup takes an optional output path and creates a backup of the database.
// The database connection is stopped before running the backup to avoid any
// corruption and if a path is not given a default is used.
// The path or an error are returned.
func (store *Store) Backup(path string) (string, error) {
	if err := store.Close(); err != nil {
		return "", fmt.Errorf("failed to close store before backup: %w", err)
	}

	filename, err := store.backupDBFile(path)
	if err != nil {
		return "", err
	}

	if _, err := store.Open(); err != nil {
		return "", fmt.Errorf("failed to reopen store after backup: %w", err)
	}

	return filename, nil
}

// backupDBFile copies the database file to the backup location.
// Does not manage connection state - works with the database file directly regardless of connection state.
func (store *Store) backupDBFile(backupPath string) (string, error) {
	if err := store.createBackupPath(); err != nil {
		return "", err
	}

	backupFilename := store.backupFilename()
	if backupPath != "" {
		backupFilename = backupPath
	}

	log.Info().Str("from", store.connection.GetDatabaseFilePath()).Str("to", backupFilename).Msg("Backing up database")

	if err := store.fileService.Copy(store.connection.GetDatabaseFilePath(), backupFilename, true); err != nil {
		return "", fmt.Errorf("failed to create backup file: %w", err)
	}

	return backupFilename, nil
}

func (store *Store) Restore() error {
	backupFilename := store.backupFilename()
	return store.RestoreFromFile(backupFilename)
}

func (store *Store) RestoreFromFile(backupFilename string) error {
	if err := store.Close(); err != nil {
		return err
	}

	if err := store.fileService.Copy(backupFilename, store.connection.GetDatabaseFilePath(), true); err != nil {
		return fmt.Errorf("unable to restore backup file %q. err: %w", backupFilename, err)
	}

	log.Info().Str("from", backupFilename).Str("to", store.connection.GetDatabaseFilePath()).Msgf("database restored")

	if _, err := store.Open(); err != nil {
		return fmt.Errorf("unable to determine version of restored portainer backup file: %w", err)
	}

	// determine the db version
	version, err := store.VersionService.Version()
	if err != nil {
		return fmt.Errorf("unable to determine restored database version. err: %w", err)
	}

	editionLabel := portainer.SoftwareEdition(version.Edition).GetEditionLabel()
	log.Info().Msgf("Restored database version: Portainer %s %s", editionLabel, version.SchemaVersion)
	return nil
}

func (store *Store) createBackupPath() error {
	backupDir := path.Join(store.connection.GetStorePath(), "backups")
	if exists, _ := store.fileService.FileExists(backupDir); !exists {
		if err := os.MkdirAll(backupDir, 0o700); err != nil {
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
