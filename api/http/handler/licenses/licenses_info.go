package licenses

import (
	"net/http"

	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/response"
)

// GET request on /api/licenses/info
func (handler *Handler) licensesInfo(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	info := handler.LicenseService.Info()

	return response.JSON(w, info)
}
