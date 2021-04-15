package backup

import (
	"net/http"

	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/response"
)

// @id BackupSettingsFetch
// @summary Fetch s3 backup settings/configurations
// @description **Access policy**: admin
// @tags backup
// @security jwt
// @produce json
// @success 200 {object} portainer.S3BackupSettings "Success"
// @failure 401 "Unauthorized"
// @failure 500 "Server error"
// @router /backup/s3/settings [get]
func (h *Handler) backupSettingsFetch(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	settings, err := h.dataStore.S3Backup().GetSettings()
	if err != nil {
		return &httperror.HandlerError{StatusCode: http.StatusInternalServerError, Message: "Unable to retrieve backup settings from the database", Err: err}
	}
	return response.JSON(w, settings)
}
