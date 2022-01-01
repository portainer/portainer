package settings

import (
	"fmt"
	"net/http"

	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/response"
	portainer "github.com/portainer/portainer/api"
)

type publicSettingsResponse struct {
	// URL to a logo that will be displayed on the login page as well as on top of the sidebar. Will use default Portainer logo when value is empty string
	LogoURL string `json:"LogoURL" example:"https://mycompany.mydomain.tld/logo.png"`
	// Active authentication method for the Portainer instance. Valid values are: 1 for internal, 2 for LDAP, or 3 for oauth
	AuthenticationMethod portainer.AuthenticationMethod `json:"AuthenticationMethod" example:"1"`
	// Whether edge compute features are enabled
	EnableEdgeComputeFeatures bool `json:"EnableEdgeComputeFeatures" example:"true"`
	// Supported feature flags
	Features map[portainer.Feature]bool `json:"Features"`
	// The URL used for oauth login
	OAuthLoginURI string `json:"OAuthLoginURI" example:"https://gitlab.com/oauth"`
	// The URL used for oauth logout
	OAuthLogoutURI string `json:"OAuthLogoutURI" example:"https://gitlab.com/oauth/logout"`
	// Whether telemetry is enabled
	EnableTelemetry bool `json:"EnableTelemetry" example:"true"`
	// The expiry of a Kubeconfig
	KubeconfigExpiry string `example:"24h" default:"0"`
}

// @id SettingsPublic
// @summary Retrieve Portainer public settings
// @description Retrieve public settings. Returns a small set of settings that are not reserved to administrators only.
// @description **Access policy**: public
// @tags settings
// @produce json
// @success 200 {object} publicSettingsResponse "Success"
// @failure 500 "Server error"
// @router /settings/public [get]
func (handler *Handler) settingsPublic(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	settings, err := handler.DataStore.Settings().Settings()
	if err != nil {
		return &httperror.HandlerError{StatusCode: http.StatusInternalServerError, Message: "Unable to retrieve the settings from the database", Err: err}
	}

	publicSettings := generatePublicSettings(settings)
	return response.JSON(w, publicSettings)
}

func generatePublicSettings(appSettings *portainer.Settings) *publicSettingsResponse {
	publicSettings := &publicSettingsResponse{
		LogoURL:                   appSettings.LogoURL,
		AuthenticationMethod:      appSettings.AuthenticationMethod,
		EnableEdgeComputeFeatures: appSettings.EnableEdgeComputeFeatures,
		EnableTelemetry:           appSettings.EnableTelemetry,
		KubeconfigExpiry:          appSettings.KubeconfigExpiry,
		Features:                  appSettings.FeatureFlagSettings,
	}
	//if OAuth authentication is on, compose the related fields from application settings
	if publicSettings.AuthenticationMethod == portainer.AuthenticationOAuth {
		publicSettings.OAuthLogoutURI = appSettings.OAuthSettings.LogoutURI
		publicSettings.OAuthLoginURI = fmt.Sprintf("%s?response_type=code&client_id=%s&redirect_uri=%s&scope=%s",
			appSettings.OAuthSettings.AuthorizationURI,
			appSettings.OAuthSettings.ClientID,
			appSettings.OAuthSettings.RedirectURI,
			appSettings.OAuthSettings.Scopes)
		//control prompt=login param according to the SSO setting
		if !appSettings.OAuthSettings.SSO {
			publicSettings.OAuthLoginURI += "&prompt=login"
		}
	}
	return publicSettings
}
