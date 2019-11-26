package settings

import (
	"fmt"
	"net/http"

	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/response"
	"github.com/portainer/portainer/api"
)

type publicSettingsResponse struct {
	LogoURL                            string                         `json:"LogoURL"`
	AuthenticationMethod               portainer.AuthenticationMethod `json:"AuthenticationMethod"`
	AllowBindMountsForRegularUsers     bool                           `json:"AllowBindMountsForRegularUsers"`
	AllowPrivilegedModeForRegularUsers bool                           `json:"AllowPrivilegedModeForRegularUsers"`
	AllowVolumeBrowserForRegularUsers  bool                           `json:"AllowVolumeBrowserForRegularUsers"`
	EnableHostManagementFeatures       bool                           `json:"EnableHostManagementFeatures"`
	ExternalTemplates                  bool                           `json:"ExternalTemplates"`
	OAuthLoginURI                      string                         `json:"OAuthLoginURI"`
}

// GET request on /api/settings/public
func (handler *Handler) settingsPublic(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	settings, err := handler.SettingsService.Settings()
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve the settings from the database", err}
	}

	publicSettings := &publicSettingsResponse{
		LogoURL:                            settings.LogoURL,
		AuthenticationMethod:               settings.AuthenticationMethod,
		AllowBindMountsForRegularUsers:     settings.AllowBindMountsForRegularUsers,
		AllowPrivilegedModeForRegularUsers: settings.AllowPrivilegedModeForRegularUsers,
		AllowVolumeBrowserForRegularUsers:  settings.AllowVolumeBrowserForRegularUsers,
		EnableHostManagementFeatures:       settings.EnableHostManagementFeatures,
		ExternalTemplates:                  false,
		OAuthLoginURI: fmt.Sprintf("%s?response_type=code&client_id=%s&redirect_uri=%s&scope=%s&prompt=login",
			settings.OAuthSettings.AuthorizationURI,
			settings.OAuthSettings.ClientID,
			settings.OAuthSettings.RedirectURI,
			settings.OAuthSettings.Scopes),
	}

	if settings.TemplatesURL != "" {
		publicSettings.ExternalTemplates = true
	}

	return response.JSON(w, publicSettings)
}
