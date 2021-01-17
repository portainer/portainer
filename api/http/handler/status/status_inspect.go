package status

import (
	"net/http"

	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/response"
)

// @summary Inspect Status
// @description
// @tags status
// @accept json
// @produce json
// @success 200 {object} portainer.Status "Status info"
// @failure 500
// @router /status [get]
func (handler *Handler) statusInspect(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	return response.JSON(w, handler.Status)
}
