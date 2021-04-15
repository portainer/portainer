package backup

import (
	"fmt"
	"log"
	"os"
	"path/filepath"
	"time"

	"github.com/pkg/errors"
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/archive"
	"github.com/portainer/portainer/api/crypto"
	"github.com/portainer/portainer/api/http/offlinegate"
	"github.com/portainer/portainer/api/s3"
)

const rwxr__r__ os.FileMode = 0744

var filesToBackup = []string{"compose", "config.json", "custom_templates", "edge_jobs", "edge_stacks", "extensions", "portainer.key", "portainer.pub", "tls"}

func BackupToS3(settings portainer.S3BackupSettings, gate *offlinegate.OfflineGate, datastore portainer.DataStore, filestorePath string) error {
	archivePath, err := CreateBackupArchive(settings.Password, gate, datastore, filestorePath)
	if err != nil {
		log.Printf("[ERROR] failed to backup: %s \n", err)
		return err
	}
	archiveReader, err := os.Open(archivePath)
	if err != nil {
		log.Println("[ERROR] failed to open backup file")
		return err
	}
	defer os.RemoveAll(filepath.Dir(archivePath))

	archiveName := fmt.Sprintf("portainer-backup_%s", filepath.Base(archivePath))

	s3session, err := s3.NewSession(settings.Region, settings.AccessKeyID, settings.SecretAccessKey)
	if err != nil {
		log.Printf("[ERROR] %s \n", err)
		return err
	}
	if err := s3.Upload(s3session, archiveReader, settings.BucketName, archiveName); err != nil {
		log.Printf("[ERROR] failed to upload backup to S3: %s \n", err)
		return err
	}
	return nil
}

// Creates a tar.gz system archive and encrypts it if password is not empty. Returns a path to the archive file.
func CreateBackupArchive(password string, gate *offlinegate.OfflineGate, datastore portainer.DataStore, filestorePath string) (string, error) {
	unlock := gate.Lock()
	defer unlock()

	backupDirPath := filepath.Join(filestorePath, "backup", time.Now().Format("2006-01-02_15-04-05"))
	if err := os.MkdirAll(backupDirPath, rwxr__r__); err != nil {
		return "", errors.Wrap(err, "Failed to create backup dir")
	}

	if err := backupDb(backupDirPath, datastore); err != nil {
		return "", errors.Wrap(err, "Failed to backup database")
	}

	for _, filename := range filesToBackup {
		err := copyPath(filepath.Join(filestorePath, filename), backupDirPath)
		if err != nil {
			return "", errors.Wrap(err, "Failed to create backup file")
		}
	}

	archivePath, err := archive.TarGzDir(backupDirPath)
	if err != nil {
		return "", errors.Wrap(err, "Failed to make an archive")
	}

	if password != "" {
		archivePath, err = encrypt(archivePath, password)
		if err != nil {
			return "", errors.Wrap(err, "Failed to encrypt backup with the password")
		}
	}

	return archivePath, nil
}

func backupDb(backupDirPath string, datastore portainer.DataStore) error {
	backupWriter, err := os.Create(filepath.Join(backupDirPath, "portainer.db"))
	if err != nil {
		return err
	}
	if err = datastore.BackupTo(backupWriter); err != nil {
		return err
	}
	return backupWriter.Close()
}

func encrypt(path string, passphrase string) (string, error) {
	in, err := os.Open(path)
	if err != nil {
		return "", err
	}
	defer in.Close()

	outFileName := fmt.Sprintf("%s.encrypted", path)
	out, err := os.Create(outFileName)
	if err != nil {
		return "", err
	}

	err = crypto.AesEncrypt(in, out, []byte(passphrase))

	return outFileName, err
}
