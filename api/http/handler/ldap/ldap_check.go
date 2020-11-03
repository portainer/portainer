package ldap

import (
	"errors"
	"net/http"

	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	"github.com/portainer/libhttp/response"
	"github.com/portainer/portainer/api"
)

type checkPayload struct {
	LDAPSettings portainer.LDAPSettings
}

func (payload *checkPayload) Validate(r *http.Request) error {
	if len(payload.LDAPSettings.URLs) == 0 {
		return errors.New("Invalid LDAP URLs. At least one URL is required")
	}

	return nil
}

// POST request on /ldap/check
func (handler *Handler) ldapCheck(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	var payload checkPayload
	err := request.DecodeAndValidateJSONPayload(r, &payload)
	if err != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid request payload", err}
	}

	settings := &payload.LDAPSettings

	err = handler.prefillSettings(settings)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to fetch default settings", err}
	}

	err = handler.LDAPService.TestConnectivity(settings)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to connect to LDAP server", err}
	}

	return response.Empty(w)
}
