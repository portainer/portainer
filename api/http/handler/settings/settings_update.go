package settings

import (
	"net/http"

	"github.com/asaskevich/govalidator"
	"github.com/portainer/portainer"
	"github.com/portainer/portainer/filesystem"
	httperror "github.com/portainer/portainer/http/error"
	"github.com/portainer/portainer/http/request"
	"github.com/portainer/portainer/http/response"
)

type settingsUpdatePayload struct {
	LogoURL                            string
	BlackListedLabels                  []portainer.Pair
	AuthenticationMethod               int
	LDAPSettings                       portainer.LDAPSettings
	AllowBindMountsForRegularUsers     bool
	AllowPrivilegedModeForRegularUsers bool
}

func (payload *settingsUpdatePayload) Validate(r *http.Request) error {
	if payload.AuthenticationMethod == 0 {
		return portainer.Error("Invalid authentication method")
	}
	if payload.AuthenticationMethod != 1 && payload.AuthenticationMethod != 2 {
		return portainer.Error("Invalid authentication method value. Value must be one of: 1 (internal) or 2 (LDAP/AD)")
	}
	if !govalidator.IsNull(payload.LogoURL) && !govalidator.IsURL(payload.LogoURL) {
		return portainer.Error("Invalid logo URL. Must correspond to a valid URL format")
	}
	return nil
}

// PUT request on /api/settings
func (handler *Handler) settingsUpdate(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	var payload settingsUpdatePayload
	err := request.DecodeAndValidateJSONPayload(r, &payload)
	if err != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid request payload", err}
	}

	settings := &portainer.Settings{
		LogoURL:                            payload.LogoURL,
		BlackListedLabels:                  payload.BlackListedLabels,
		LDAPSettings:                       payload.LDAPSettings,
		AllowBindMountsForRegularUsers:     payload.AllowBindMountsForRegularUsers,
		AllowPrivilegedModeForRegularUsers: payload.AllowPrivilegedModeForRegularUsers,
	}

	settings.AuthenticationMethod = portainer.AuthenticationMethod(payload.AuthenticationMethod)
	tlsError := handler.updateTLS(settings)
	if tlsError != nil {
		return tlsError
	}

	err = handler.SettingsService.UpdateSettings(settings)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to persist settings changes inside the database", err}
	}

	return response.JSON(w, settings)
}

func (handler *Handler) updateTLS(settings *portainer.Settings) *httperror.HandlerError {
	if (settings.LDAPSettings.TLSConfig.TLS || settings.LDAPSettings.StartTLS) && !settings.LDAPSettings.TLSConfig.TLSSkipVerify {
		caCertPath, _ := handler.FileService.GetPathForTLSFile(filesystem.LDAPStorePath, portainer.TLSFileCA)
		settings.LDAPSettings.TLSConfig.TLSCACertPath = caCertPath
	} else {
		settings.LDAPSettings.TLSConfig.TLSCACertPath = ""
		err := handler.FileService.DeleteTLSFiles(filesystem.LDAPStorePath)
		if err != nil {
			return &httperror.HandlerError{http.StatusInternalServerError, "Unable to remove TLS files from disk", err}
		}
	}
	return nil
}
