package bolt

import (
	"fmt"
	"io/ioutil"
	"os"
	"path"
	"time"

	portainer "github.com/portainer/portainer/api"
	plog "github.com/portainer/portainer/api/bolt/log"
)

var backupDefaults = struct {
	backupDir        string
	editions         []string
	databaseFileName string
}{
	"backups",
	[]string{"CE", "BE", "EE"},
	databaseFileName,
}

var backupLog = plog.NewScopedLog("bolt, backup")

//
// Backup Helpers
//

// createBackupFolders create initial folders for backups
func (store *Store) createBackupFolders() {
	for _, e := range backupDefaults.editions {

		p := path.Join(store.path, backupDefaults.backupDir, e)

		if exists, _ := store.fileService.FileExists(p); !exists {
			err := os.MkdirAll(p, 0700)
			if err != nil {
				backupLog.Error("Error while creating backup folders", err)
			}
		}
	}
}

func (store *Store) databasePath() string {
	return path.Join(store.path, databaseFileName)
}

func (store *Store) editionBackupDir(edition portainer.SoftwareEdition) string {
	return path.Join(store.path, backupDefaults.backupDir, edition.GetEditionLabel())
}

func (store *Store) copyDBFile(from string, to string) error {
	backupLog.Info(fmt.Sprintf("Copying db file from %s to %s", from, to))
	err := store.fileService.Copy(from, to, true)
	if err != nil {
		backupLog.Error("Failed", err)
	}
	return err
}

// BackupOptions provide a helper to inject backup options
type BackupOptions struct {
	Edition        portainer.SoftwareEdition
	Version        int
	BackupDir      string
	BackupFileName string
	BackupPath     string
}

func (store *Store) setupOptions(options *BackupOptions) *BackupOptions {
	if options == nil {
		options = &BackupOptions{}
	}
	if options.Edition == 0 {
		options.Edition = store.edition()
	}
	if options.Version == 0 {
		options.Version, _ = store.version()
	}
	if options.BackupDir == "" {
		options.BackupDir = store.editionBackupDir(options.Edition)
	}
	if options.BackupFileName == "" {
		options.BackupFileName = fmt.Sprintf("%s.%s.%s", backupDefaults.databaseFileName, fmt.Sprintf("%03d", options.Version), time.Now().Format("20060102150405"))
	}
	if options.BackupPath == "" {
		options.BackupPath = path.Join(options.BackupDir, options.BackupFileName)
	}
	return options
}

func (store *Store) listEditionBackups(edition portainer.SoftwareEdition) ([]string, error) {
	var fileNames = []string{}

	files, err := ioutil.ReadDir(store.editionBackupDir(edition))

	if err != nil {
		backupLog.Error("Error while retrieving backup files", err)
		return fileNames, err
	}

	for _, f := range files {
		fileNames = append(fileNames, f.Name())
	}

	return fileNames, nil
}

func (store *Store) lastestEditionBackup() (string, error) {
	edition := store.edition()

	files, err := store.listEditionBackups(edition)
	if err != nil {
		backupLog.Error("Error while retrieving backup files", err)
		return "", err
	}

	if len(files) == 0 {
		return "", nil
	}

	return files[len(files)-1], nil
}

// BackupWithOptions backup current database with options
func (store *Store) BackupWithOptions(options *BackupOptions) (string, error) {
	backupLog.Info("creating db backup")
	store.createBackupFolders()

	options = store.setupOptions(options)

	return options.BackupPath, store.copyDBFile(store.databasePath(), options.BackupPath)
}

// Backup current database with default options
func (store *Store) Backup() (string, error) {
	return store.BackupWithOptions(nil)
}

// RestoreWithOptions previously saved backup for the current Edition  with options
// Restore strategies:
// - default: restore latest from current edition
// - restore a specific
func (store *Store) RestoreWithOptions(options *BackupOptions) error {

	// Check if backup file exist before restoring

	options = store.setupOptions(options)

	_, err := os.Stat(options.BackupPath)

	if os.IsNotExist(err) {
		backupLog.Error(fmt.Sprintf("Backup file to restore does not exist %s", options.BackupPath), err)
		return err
	}

	err = store.Close()
	if err != nil {
		backupLog.Error("Error while closing store before restore", err)
		return err
	}
	backupLog.Info("Restoring db backup")
	err = store.copyDBFile(options.BackupPath, store.databasePath())
	if err != nil {
		return err
	}
	return store.Open()
}

// Restore previously saved backup for the current Edition  with default options
func (store *Store) Restore() error {
	var options = &BackupOptions{}
	var err error
	options.BackupFileName, err = store.lastestEditionBackup()
	if err != nil {
		return err
	}
	return store.RestoreWithOptions(options)

}
