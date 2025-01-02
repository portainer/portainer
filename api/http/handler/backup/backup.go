package backup

import (
	"net/http"
	"os"
	"path/filepath"

	operations "github.com/portainer/portainer/api/backup"
	httperror "github.com/portainer/portainer/pkg/libhttp/error"
	"github.com/portainer/portainer/pkg/libhttp/request"
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
	if err := request.DecodeAndValidateJSONPayload(r, &payload); err != nil {
		return httperror.BadRequest("Invalid request payload", err)
	}

	archivePath, err := operations.CreateBackupArchive(payload.Password, h.gate, h.dataStore, h.filestorePath)
	if err != nil {
		return httperror.InternalServerError("Failed to create backup", err)
	}
	defer os.RemoveAll(filepath.Dir(archivePath))

	w.Header().Set("Content-Disposition", "attachment; filename=portainer-backup_"+filepath.Base(archivePath))
	http.ServeFile(w, r, archivePath)

	return nil
}
