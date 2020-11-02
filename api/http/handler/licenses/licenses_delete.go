package licenses

import (
	"errors"
	"net/http"

	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	"github.com/portainer/libhttp/response"
)

type (
	deletePayload struct {
		LicenseKeys []string
	}

	deleteResponse struct {
		FailedKeys map[string]string `json:"failedKeys"`
	}
)

func (payload *deletePayload) Validate(r *http.Request) error {
	if payload.LicenseKeys == nil || len(payload.LicenseKeys) == 0 {
		return errors.New("Missing licenses keys")
	}

	return nil
}

// DELETE request on /api/licenses
func (handler *Handler) licensesDelete(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	var payload deletePayload
	err := request.DecodeAndValidateJSONPayload(r, &payload)
	if err != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid request payload", err}
	}

	resp := &attachResponse{
		FailedKeys: map[string]string{},
	}

	for _, licenseKey := range payload.LicenseKeys {
		err := handler.LicenseService.DeleteLicense(licenseKey)
		if err != nil {
			resp.FailedKeys[licenseKey] = err.Error()
		}
	}

	return response.JSON(w, resp)
}
