package settings

import (
	"net/http"

	"github.com/asaskevich/govalidator"
	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	"github.com/portainer/libhttp/response"
	"github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/filesystem"
)

type settingsUpdatePayload struct {
	LogoURL                            *string
	BlackListedLabels                  []portainer.Pair
	AuthenticationMethod               *int
	LDAPSettings                       *portainer.LDAPSettings
	OAuthSettings                      *portainer.OAuthSettings
	AllowBindMountsForRegularUsers     *bool
	AllowPrivilegedModeForRegularUsers *bool
	AllowVolumeBrowserForRegularUsers  *bool
	EnableHostManagementFeatures       *bool
	SnapshotInterval                   *string
	TemplatesURL                       *string
	EdgeAgentCheckinInterval           *int
}

func (payload *settingsUpdatePayload) Validate(r *http.Request) error {
	if *payload.AuthenticationMethod != 1 && *payload.AuthenticationMethod != 2 && *payload.AuthenticationMethod != 3 {
		return portainer.Error("Invalid authentication method value. Value must be one of: 1 (internal), 2 (LDAP/AD) or 3 (OAuth)")
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
		ldapPassword := settings.LDAPSettings.Password
		if payload.LDAPSettings.Password != "" {
			ldapPassword = payload.LDAPSettings.Password
		}
		settings.LDAPSettings = *payload.LDAPSettings
		settings.LDAPSettings.Password = ldapPassword
	}

	if payload.OAuthSettings != nil {
		clientSecret := payload.OAuthSettings.ClientSecret
		if clientSecret == "" {
			clientSecret = settings.OAuthSettings.ClientSecret
		}
		settings.OAuthSettings = *payload.OAuthSettings
		settings.OAuthSettings.ClientSecret = clientSecret
	}

	if payload.AllowBindMountsForRegularUsers != nil {
		settings.AllowBindMountsForRegularUsers = *payload.AllowBindMountsForRegularUsers
	}

	if payload.AllowPrivilegedModeForRegularUsers != nil {
		settings.AllowPrivilegedModeForRegularUsers = *payload.AllowPrivilegedModeForRegularUsers
	}

	updateAuthorizations := false
	if payload.AllowVolumeBrowserForRegularUsers != nil {
		settings.AllowVolumeBrowserForRegularUsers = *payload.AllowVolumeBrowserForRegularUsers
		updateAuthorizations = true
	}

	if payload.EnableHostManagementFeatures != nil {
		settings.EnableHostManagementFeatures = *payload.EnableHostManagementFeatures
	}

	if payload.SnapshotInterval != nil && *payload.SnapshotInterval != settings.SnapshotInterval {
		err := handler.updateSnapshotInterval(settings, *payload.SnapshotInterval)
		if err != nil {
			return &httperror.HandlerError{http.StatusInternalServerError, "Unable to update snapshot interval", err}
		}
	}

	if payload.EdgeAgentCheckinInterval != nil {
		settings.EdgeAgentCheckinInterval = *payload.EdgeAgentCheckinInterval
	}

	tlsError := handler.updateTLS(settings)
	if tlsError != nil {
		return tlsError
	}

	err = handler.SettingsService.UpdateSettings(settings)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to persist settings changes inside the database", err}
	}

	if updateAuthorizations {
		err := handler.updateVolumeBrowserSetting(settings)
		if err != nil {
			return &httperror.HandlerError{http.StatusInternalServerError, "Unable to update RBAC authorizations", err}
		}
	}

	return response.JSON(w, settings)
}

func (handler *Handler) updateVolumeBrowserSetting(settings *portainer.Settings) error {
	err := handler.AuthorizationService.UpdateVolumeBrowsingAuthorizations(settings.AllowVolumeBrowserForRegularUsers)
	if err != nil {
		return err
	}

	extension, err := handler.ExtensionService.Extension(portainer.RBACExtension)
	if err != nil && err != portainer.ErrObjectNotFound {
		return err
	}

	if extension != nil {
		err = handler.AuthorizationService.UpdateUsersAuthorizations()
		if err != nil {
			return err
		}
	}

	return nil
}

func (handler *Handler) updateSnapshotInterval(settings *portainer.Settings, snapshotInterval string) error {
	settings.SnapshotInterval = snapshotInterval

	schedules, err := handler.ScheduleService.SchedulesByJobType(portainer.SnapshotJobType)
	if err != nil {
		return err
	}

	if len(schedules) != 0 {
		snapshotSchedule := schedules[0]
		snapshotSchedule.CronExpression = "@every " + snapshotInterval

		err := handler.JobScheduler.UpdateSystemJobSchedule(portainer.SnapshotJobType, snapshotSchedule.CronExpression)
		if err != nil {
			return err
		}

		err = handler.ScheduleService.UpdateSchedule(snapshotSchedule.ID, &snapshotSchedule)
		if err != nil {
			return err
		}
	}

	return nil
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
