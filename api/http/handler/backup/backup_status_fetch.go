package backup

import (
	"net/http"
	"time"

	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/response"
)

type backupStatus struct {
	Failed       bool
	TimestampUTC string
}

// @id BackupStatusFetch
// @summary Fetch the status of the last scheduled backup run
// @description **Access policy**: public
// @tags backup
// @produce json
// @success 200 {object} backupStatus "Success"
// @failure 500 "Server error"
// @router /backup/s3/status [get]
func (h *Handler) backupStatusFetch(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	status, err := h.dataStore.S3Backup().GetStatus()
	if err != nil {
		return &httperror.HandlerError{StatusCode: http.StatusInternalServerError, Message: "Unable to retrieve last backup run status from the database", Err: err}
	}
	return response.JSON(w, backupStatus{Failed: status.Failed, TimestampUTC: status.Timestamp.UTC().Format(time.RFC3339)})
}
