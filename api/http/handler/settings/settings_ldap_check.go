package settings

import (
	"net/http"

	"github.com/portainer/portainer"
	"github.com/portainer/portainer/filesystem"
	httperror "github.com/portainer/portainer/http/error"
	"github.com/portainer/portainer/http/request"
	"github.com/portainer/portainer/http/response"
)

type settingsLDAPCheckPayload struct {
	LDAPSettings portainer.LDAPSettings
}

func (payload *settingsLDAPCheckPayload) Validate(r *http.Request) error {
	return nil
}

// PUT request on /settings/ldap/check
func (handler *Handler) settingsLDAPCheck(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	var payload settingsLDAPCheckPayload
	err := request.DecodeAndValidateJSONPayload(r, &payload)
	if err != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid request payload", err}
	}

	if (payload.LDAPSettings.TLSConfig.TLS || payload.LDAPSettings.StartTLS) && !payload.LDAPSettings.TLSConfig.TLSSkipVerify {
		caCertPath, _ := handler.FileService.GetPathForTLSFile(filesystem.LDAPStorePath, portainer.TLSFileCA)
		payload.LDAPSettings.TLSConfig.TLSCACertPath = caCertPath
	}

	err = handler.LDAPService.TestConnectivity(&payload.LDAPSettings)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to connect to LDAP server", err}
	}

	return response.Empty(w)
}
