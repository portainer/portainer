package status

import (
	"net/http"

	httperror "github.com/portainer/portainer/http/error"
	"github.com/portainer/portainer/http/response"
)

// GET request on /api/status
func (handler *Handler) statusInspect(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	return response.JSON(w, handler.Status)
}
