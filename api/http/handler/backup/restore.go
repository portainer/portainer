package backup

import (
	"bytes"
	"errors"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"time"

	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	"github.com/portainer/portainer/api/archive"
	"github.com/portainer/portainer/api/crypto"
)

var filesToRestore = append(filesToBackup, "portainer.db")

type restorePayload struct {
	FileContent []byte
	FileName    string
	Password    string
}

func (h *Handler) restore(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	initialized, err := h.adminMonitor.WasInitialized()
	if err != nil {
		return &httperror.HandlerError{StatusCode: http.StatusInternalServerError, Message: "Failed to check system initialization", Err: err}
	}
	if initialized {
		return &httperror.HandlerError{StatusCode: http.StatusBadRequest, Message: "Cannot restore already initialized instance", Err: errors.New("system already initialized")}
	}
	h.adminMonitor.Stop()
	defer h.adminMonitor.Start()

	var payload restorePayload
	err = decodeForm(r, &payload)
	if err != nil {
		return &httperror.HandlerError{StatusCode: http.StatusBadRequest, Message: "Invalid request payload", Err: err}
	}

	var archiveReader io.Reader = bytes.NewReader(payload.FileContent)
	if payload.Password != "" {
		archiveReader, err = decrypt(archiveReader, payload.Password)
		if err != nil {
			return &httperror.HandlerError{StatusCode: http.StatusInternalServerError, Message: "Failed to decrypt the archive", Err: err}
		}
	}

	restorePath := filepath.Join(h.filestorePath, "restore", time.Now().Format("20060102150405"))
	defer os.RemoveAll(restorePath)

	err = extractArchive(archiveReader, restorePath)
	if err != nil {
		return &httperror.HandlerError{StatusCode: http.StatusInternalServerError, Message: "Cannot extract files from the archive. Please ensure the password is correct and try again", Err: errors.New("Cannot extract files from the archive. Please ensure the password is correct and try again")}
	}

	unlock := h.gate.Lock()
	defer unlock()

	if err = h.dataStore.Close(); err != nil {
		return &httperror.HandlerError{StatusCode: http.StatusInternalServerError, Message: "Failed to stop db", Err: err}
	}

	if err = restoreFiles(restorePath, h.filestorePath); err != nil {
		return &httperror.HandlerError{StatusCode: http.StatusInternalServerError, Message: "Failed to restore the system state", Err: err}
	}

	h.shutdownTrigger()

	return nil
}

func decodeForm(r *http.Request, p *restorePayload) error {
	content, name, err := request.RetrieveMultiPartFormFile(r, "file")
	if err != nil {
		return err
	}
	p.FileContent = content
	p.FileName = name

	password, _ := request.RetrieveMultiPartFormValue(r, "password", true)
	p.Password = password
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
		err := copyPath(filepath.Join(srcDir, filename), destinationDir)
		if err != nil {
			return err
		}
	}
	return nil
}
