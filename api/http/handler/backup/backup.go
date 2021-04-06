package backup

import (
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"time"

	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/archive"
	"github.com/portainer/portainer/api/crypto"
)

var filesToBackup = []string{"compose", "config.json", "custom_templates", "edge_jobs", "edge_stacks", "extensions", "portainer.key", "portainer.pub", "tls"}

type backupPayload struct {
	Password string
}

func (p *backupPayload) Validate(r *http.Request) error {
	return nil
}

func (h *Handler) backup(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	var payload backupPayload
	err := request.DecodeAndValidateJSONPayload(r, &payload)
	if err != nil {
		return &httperror.HandlerError{StatusCode: http.StatusBadRequest, Message: "Invalid request payload", Err: err}
	}

	unlock := h.gate.Lock()
	defer unlock()

	backupDirPath := filepath.Join(h.filestorePath, "backup", time.Now().Format("2006-01-02_15-04-05"))
	if err := os.MkdirAll(backupDirPath, 0744); err != nil {
		return &httperror.HandlerError{StatusCode: http.StatusInternalServerError, Message: "Failed to create backup dir", Err: err}
	}
	defer os.RemoveAll(backupDirPath)

	if err = backupDb(backupDirPath, h.dataStore); err != nil {
		return &httperror.HandlerError{StatusCode: http.StatusInternalServerError, Message: "Failed to backup database", Err: err}
	}

	for _, filename := range filesToBackup {
		err := copyPath(filepath.Join(h.filestorePath, filename), backupDirPath)
		if err != nil {
			return &httperror.HandlerError{StatusCode: http.StatusInternalServerError, Message: "Failed to create backup file", Err: err}
		}
	}

	archivePath, err := archive.TarGzDir(backupDirPath)
	if err != nil {
		return &httperror.HandlerError{StatusCode: http.StatusInternalServerError, Message: "Failed to make an archive", Err: err}
	}

	if payload.Password != "" {
		archivePath, err = encrypt(archivePath, payload.Password)
		if err != nil {
			return &httperror.HandlerError{StatusCode: http.StatusInternalServerError, Message: "Failed to encrypt backup with the password", Err: err}
		}
	}

	w.Header().Set("Content-Disposition", fmt.Sprintf("attachment; filename=%s", fmt.Sprintf("portainer-backup_%s", filepath.Base(archivePath))))
	http.ServeFile(w, r, archivePath)

	return nil
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
