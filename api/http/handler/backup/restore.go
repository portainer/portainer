package backup

import (
	"bytes"
	"io"
	"net/http"

	"github.com/pkg/errors"
	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	operations "github.com/portainer/portainer/api/backup"
)

type restorePayload struct {
	FileContent []byte
	FileName    string
	Password    string
}

// @id Restore
// @summary Triggers a system restore using provided backup file
// @description Triggers a system restore using provided backup file
// @description **Access policy**: public
// @tags backup
// @accept json
// @param restorePayload body restorePayload true "Restore request payload"
// @success 200 "Success"
// @failure 400 "Invalid request"
// @failure 500 "Server error"
// @router /restore [post]
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
	err = operations.RestoreArchive(archiveReader, payload.Password, h.filestorePath, h.gate, h.dataStore, h.shutdownTrigger)
	if err != nil {
		return &httperror.HandlerError{StatusCode: http.StatusInternalServerError, Message: "Failed to restore the backup", Err: err}
	}

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
