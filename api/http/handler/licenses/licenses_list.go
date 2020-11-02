package licenses

import (
	"net/http"

	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/response"
)

// GET request on /api/licenses
func (handler *Handler) licensesList(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	licenses, err := handler.LicenseService.Licenses()
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve Licenses from the database", err}
	}

	return response.JSON(w, licenses)
}
