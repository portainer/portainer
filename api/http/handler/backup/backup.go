package backup

import (
	"fmt"
	"net/http"
	"os"
	"path/filepath"

	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	operations "github.com/portainer/portainer/api/backup"
)

type (
	backupPayload struct {
		Password string
	}
)

func (p *backupPayload) Validate(r *http.Request) error {
	return nil
}

// @id Backup
// @summary Creates an archive with a system data snapshot that could be used to restore the system.
// @description  Creates an archive with a system data snapshot that could be used to restore the system.
// @description **Access policy**: admin
// @tags backup
// @security ApiKeyAuth
// @security jwt
// @accept json
// @produce octet-stream
// @param body body backupPayload false "An object contains the password to encrypt the backup with"
// @success 200 "Success"
// @failure 400 "Invalid request"
// @failure 500 "Server error"
// @router /backup [post]
func (h *Handler) backup(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	var payload backupPayload
	err := request.DecodeAndValidateJSONPayload(r, &payload)
	if err != nil {
		return &httperror.HandlerError{StatusCode: http.StatusBadRequest, Message: "Invalid request payload", Err: err}
	}

	archivePath, err := operations.CreateBackupArchive(payload.Password, h.gate, h.dataStore, h.filestorePath)
	if err != nil {
		return &httperror.HandlerError{StatusCode: http.StatusInternalServerError, Message: "Failed to create backup", Err: err}
	}
	defer os.RemoveAll(filepath.Dir(archivePath))

	w.Header().Set("Content-Disposition", fmt.Sprintf("attachment; filename=%s", fmt.Sprintf("portainer-backup_%s", filepath.Base(archivePath))))
	http.ServeFile(w, r, archivePath)

	return nil
}
