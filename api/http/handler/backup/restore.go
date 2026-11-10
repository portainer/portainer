package backup

import (
	"bytes"
	"errors"
	"io"
	"net/http"

	operations "github.com/portainer/portainer/api/backup"
	"github.com/portainer/portainer/api/crypto"
	"github.com/portainer/portainer/api/http/security/setuptoken"
	httperror "github.com/portainer/portainer/pkg/libhttp/error"
	"github.com/portainer/portainer/pkg/libhttp/request"
)

type restorePayload struct {
	FileContent []byte
	FileName    string
	Password    string
}

// @id Restore
// @summary Triggers a system restore using provided backup file
// @description Triggers a system restore using provided backup file
// @description **Access policy**: public (requires the X-Setup-Token header on an uninitialized instance unless --no-setup-token is set)
// @tags backup
// @accept json
// @param X-Setup-Token header string false "Setup token (required when instance is uninitialized and --no-setup-token is not set)"
// @param restorePayload body restorePayload true "Restore request payload"
// @success 200 "Success"
// @failure 400 "Invalid request"
// @failure 403 "Access denied - invalid or missing setup token"
// @failure 500 "Server error"
// @router /restore [post]
func (h *Handler) restore(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	if err := setuptoken.Validate(r, h.SetupToken); err != nil {
		return err
	}

	initialized, err := h.adminMonitor.WasInitialized()
	if err != nil {
		return httperror.InternalServerError("Failed to check system initialization", err)
	}
	if initialized {
		return httperror.BadRequest("Cannot restore already initialized instance", errors.New("system already initialized"))
	}
	h.adminMonitor.Stop()

	var payload restorePayload
	err = decodeForm(r, &payload)
	if err != nil {
		return httperror.BadRequest("Invalid request payload", err)
	}

	var archiveReader io.Reader = bytes.NewReader(payload.FileContent)
	err = operations.RestoreArchive(archiveReader, payload.Password, h.filestorePath, h.gate, h.dataStore, h.shutdownTrigger)
	if err != nil {
		return restoreError(err)
	}

	return nil
}

// restoreError maps a restore failure to the right status code. A backup that does
// not match this server's fips mode is a bad request, not a server error.
func restoreError(err error) *httperror.HandlerError {
	switch {
	case errors.Is(err, operations.ErrPasswordRequiredInFIPSMode),
		errors.Is(err, crypto.ErrNonFIPSEncryptedFileInFIPSMode),
		errors.Is(err, crypto.ErrFIPSEncryptedFileInNonFIPSMode),
		errors.Is(err, crypto.ErrNonFIPSApprovedEncryptionInFIPSMode):
		return httperror.BadRequest("Cannot restore this backup", err)
	}

	return httperror.InternalServerError("Failed to restore the backup", err)
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
