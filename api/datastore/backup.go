package datastore

import (
	"fmt"
	"os"
	"path"
	"time"

	"github.com/rs/zerolog/log"
)

var backupDefaults = struct {
	backupDir string
	commonDir string
}{
	"backups",
	"common",
}

//
// Backup Helpers
//

// createBackupFolders create initial folders for backups
func (store *Store) createBackupFolders() {
	// create common dir
	commonDir := store.commonBackupDir()
	if exists, _ := store.fileService.FileExists(commonDir); !exists {
		if err := os.MkdirAll(commonDir, 0700); err != nil {
			log.Error().Err(err).Msg("error while creating common backup folder")
		}
	}
}

func (store *Store) databasePath() string {
	return store.connection.GetDatabaseFilePath()
}

func (store *Store) commonBackupDir() string {
	return path.Join(store.connection.GetStorePath(), backupDefaults.backupDir, backupDefaults.commonDir)
}

func (store *Store) copyDBFile(from string, to string) error {
	log.Info().Str("from", from).Str("to", to).Msg("copying DB file")

	err := store.fileService.Copy(from, to, true)
	if err != nil {
		log.Error().Err(err).Msg("failed")
	}

	return err
}

// BackupOptions provide a helper to inject backup options
type BackupOptions struct {
	Version        string
	BackupDir      string
	BackupFileName string
	BackupPath     string
}

// getBackupRestoreOptions returns options to store db at common backup dir location; used by:
// - db backup prior to version upgrade
// - db rollback
func getBackupRestoreOptions(backupDir string) *BackupOptions {
	return &BackupOptions{
		BackupDir:      backupDir, //connection.commonBackupDir(),
		BackupFileName: beforePortainerVersionUpgradeBackup,
	}
}

// Backup current database with default options
func (store *Store) Backup() (string, error) {
	return store.backupWithOptions(nil)
}

func (store *Store) setupOptions(options *BackupOptions) *BackupOptions {
	if options == nil {
		options = &BackupOptions{}
	}
	if options.Version == "" {
		v, err := store.VersionService.Version()
		if err != nil {
			options.Version = ""
		}
		options.Version = v.SchemaVersion
	}
	if options.BackupDir == "" {
		options.BackupDir = store.commonBackupDir()
	}
	if options.BackupFileName == "" {
		options.BackupFileName = fmt.Sprintf("%s.%s.%s", store.connection.GetDatabaseFileName(), options.Version, time.Now().Format("20060102150405"))
	}
	if options.BackupPath == "" {
		options.BackupPath = path.Join(options.BackupDir, options.BackupFileName)
	}
	return options
}

// BackupWithOptions backup current database with options
func (store *Store) backupWithOptions(options *BackupOptions) (string, error) {
	log.Info().Msg("creating DB backup")

	store.createBackupFolders()

	options = store.setupOptions(options)
	dbPath := store.databasePath()

	if err := store.Close(); err != nil {
		return options.BackupPath, fmt.Errorf(
			"error closing datastore before creating backup: %v",
			err,
		)
	}

	if err := store.copyDBFile(dbPath, options.BackupPath); err != nil {
		return options.BackupPath, err
	}

	if _, err := store.Open(); err != nil {
		return options.BackupPath, fmt.Errorf(
			"error opening datastore after creating backup: %v",
			err,
		)
	}

	return options.BackupPath, nil
}

// RestoreWithOptions previously saved backup for the current Edition  with options
// Restore strategies:
// - default: restore latest from current edition
// - restore a specific
func (store *Store) restoreWithOptions(options *BackupOptions) error {
	options = store.setupOptions(options)

	// Check if backup file exist before restoring
	_, err := os.Stat(options.BackupPath)
	if os.IsNotExist(err) {
		log.Error().Str("path", options.BackupPath).Err(err).Msg("backup file to restore does not exist %s")

		return err
	}

	err = store.Close()
	if err != nil {
		log.Error().Err(err).Msg("error while closing store before restore")

		return err
	}

	log.Info().Msg("restoring DB backup")
	err = store.copyDBFile(options.BackupPath, store.databasePath())
	if err != nil {
		return err
	}

	_, err = store.Open()
	return err
}

// RemoveWithOptions removes backup database based on supplied options
func (store *Store) removeWithOptions(options *BackupOptions) error {
	log.Info().Msg("removing DB backup")

	options = store.setupOptions(options)
	_, err := os.Stat(options.BackupPath)

	if os.IsNotExist(err) {
		log.Error().Str("path", options.BackupPath).Err(err).Msg("backup file to remove does not exist")

		return err
	}

	log.Info().Str("path", options.BackupPath).Msg("removing DB file")
	err = os.Remove(options.BackupPath)
	if err != nil {
		log.Error().Err(err).Msg("failed")

		return err
	}

	return nil
}
