package backup

import (
	"fmt"
	"net/http"
	"os"
	"path/filepath"

	"github.com/pkg/errors"
	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	portainer "github.com/portainer/portainer/api"
	operations "github.com/portainer/portainer/api/backup"
)

type (
	backupPayload struct {
		Password string
	}
	s3BackupPayload struct {
		portainer.S3BackupSettings
	}
)

func (p *backupPayload) Validate(r *http.Request) error {
	return nil
}

func (payload *s3BackupPayload) Validate(r *http.Request) error {
	switch {
	case payload.AccessKeyID == "":
		return errors.New("missing AccessKeyID")
	case payload.SecretAccessKey == "":
		return errors.New("missing SecretAccessKey")
	case payload.Region == "":
		return errors.New("missing Region")
	case payload.BucketName == "":
		return errors.New("missing BucketName")
	default:
		return nil
	}
}

// @id Backup
// @summary Creates an archive with a system data snapshot that could be used to restore the system.
// @description  Creates an archive with a system data snapshot that could be used to restore the system.
// @description **Access policy**: admin
// @tags backup
// @security jwt
// @produce octet-stream
// @param Password body string false "Password to encrypt the backup with"
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

// @id BackupToS3
// @summary Execute backup to AWS S3 Bucket
// @description Creates an archive with a system data snapshot and upload it to the target S3 bucket
// @description **Access policy**: admin
// @tags backup
// @security jwt
// @param body body s3BackupPayload true "S3 backup settings"
// @success 204 "Success"
// @failure 400 "Invalid request"
// @failure 500 "Server error"
// @router /backup/s3/execute [post]
func (h *Handler) backupToS3(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	var payload s3BackupPayload
	if err := request.DecodeAndValidateJSONPayload(r, &payload); err != nil {
		return &httperror.HandlerError{StatusCode: http.StatusBadRequest, Message: "Invalid request payload", Err: err}
	}
	if err := operations.BackupToS3(payload.S3BackupSettings, h.gate, h.dataStore, h.filestorePath); err != nil {
		return &httperror.HandlerError{StatusCode: http.StatusInternalServerError, Message: "Failed to execute S3 backup", Err: err}
	}
	w.WriteHeader(http.StatusNoContent)
	return nil
}
