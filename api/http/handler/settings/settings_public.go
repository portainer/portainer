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
	// The URL used for oauth login
	OAuthLoginURI string `json:"OAuthLoginURI" example:"https://gitlab.com/oauth"`
	// Whether telemetry is enabled
	EnableTelemetry bool `json:"EnableTelemetry" example:"true"`
}

// @id
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
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve the settings from the database", err}
	}

	publicSettings := &publicSettingsResponse{
		LogoURL:                   settings.LogoURL,
		AuthenticationMethod:      settings.AuthenticationMethod,
		EnableEdgeComputeFeatures: settings.EnableEdgeComputeFeatures,
		EnableTelemetry:           settings.EnableTelemetry,
		OAuthLoginURI: fmt.Sprintf("%s?response_type=code&client_id=%s&redirect_uri=%s&scope=%s&prompt=login",
			settings.OAuthSettings.AuthorizationURI,
			settings.OAuthSettings.ClientID,
			settings.OAuthSettings.RedirectURI,
			settings.OAuthSettings.Scopes),
	}

	return response.JSON(w, publicSettings)
}
