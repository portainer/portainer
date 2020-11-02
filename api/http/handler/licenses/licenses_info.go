package licenses

import (
	"net/http"

	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/response"
)

// GET request on /api/licenses/info
func (handler *Handler) licensesInfo(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	info, err := handler.LicenseService.Info()
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve licenses info from the database", err}
	}

	return response.JSON(w, info)
}
