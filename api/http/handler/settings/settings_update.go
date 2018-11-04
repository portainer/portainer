package settings

import (
	"net/http"

	"github.com/asaskevich/govalidator"
	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	"github.com/portainer/libhttp/response"
	"github.com/portainer/portainer"
	"github.com/portainer/portainer/cron"
	"github.com/portainer/portainer/filesystem"
)

type settingsUpdatePayload struct {
	LogoURL                            *string
	BlackListedLabels                  []portainer.Pair
	AuthenticationMethod               *int
	LDAPSettings                       *portainer.LDAPSettings
	AllowBindMountsForRegularUsers     *bool
	AllowPrivilegedModeForRegularUsers *bool
	SnapshotInterval                   *string
	TemplatesURL                       *string
}

func (payload *settingsUpdatePayload) Validate(r *http.Request) error {
	if *payload.AuthenticationMethod != 1 && *payload.AuthenticationMethod != 2 {
		return portainer.Error("Invalid authentication method value. Value must be one of: 1 (internal) or 2 (LDAP/AD)")
	}
	if payload.LogoURL != nil && *payload.LogoURL != "" && !govalidator.IsURL(*payload.LogoURL) {
		return portainer.Error("Invalid logo URL. Must correspond to a valid URL format")
	}
	if payload.TemplatesURL != nil && *payload.TemplatesURL != "" && !govalidator.IsURL(*payload.TemplatesURL) {
		return portainer.Error("Invalid external templates URL. Must correspond to a valid URL format")
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

	settings, err := handler.SettingsService.Settings()
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve the settings from the database", err}
	}

	if payload.AuthenticationMethod != nil {
		settings.AuthenticationMethod = portainer.AuthenticationMethod(*payload.AuthenticationMethod)
	}

	if payload.LogoURL != nil {
		settings.LogoURL = *payload.LogoURL
	}

	if payload.TemplatesURL != nil {
		settings.TemplatesURL = *payload.TemplatesURL
	}

	if payload.BlackListedLabels != nil {
		settings.BlackListedLabels = payload.BlackListedLabels
	}

	if payload.LDAPSettings != nil {
		settings.LDAPSettings = *payload.LDAPSettings
	}

	if payload.AllowBindMountsForRegularUsers != nil {
		settings.AllowBindMountsForRegularUsers = *payload.AllowBindMountsForRegularUsers
	}

	if payload.AllowPrivilegedModeForRegularUsers != nil {
		settings.AllowPrivilegedModeForRegularUsers = *payload.AllowPrivilegedModeForRegularUsers
	}

	if payload.SnapshotInterval != nil && *payload.SnapshotInterval != settings.SnapshotInterval {
		settings.SnapshotInterval = *payload.SnapshotInterval

		err := handler.JobScheduler.UpdateScheduledTask(0, "@every "+*payload.SnapshotInterval, cron.NewSnapshotTask(nil))
		if err != nil {
			return &httperror.HandlerError{http.StatusInternalServerError, "Unable to update task scheduler", err}
		}
	}

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
