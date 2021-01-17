package settings

import (
	"fmt"
	"net/http"

	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/response"
	portainer "github.com/portainer/portainer/api"
)

type publicSettingsResponse struct {
	LogoURL                   string                         `json:"LogoURL"`
	AuthenticationMethod      portainer.AuthenticationMethod `json:"AuthenticationMethod"`
	EnableEdgeComputeFeatures bool                           `json:"EnableEdgeComputeFeatures"`
	OAuthLoginURI             string                         `json:"OAuthLoginURI"`
	EnableTelemetry           bool                           `json:"EnableTelemetry"`
}

// @summary Inspect Public Settings
// @description
// @tags settings
// @security ApiKeyAuth
// @accept json
// @produce json
// @success 200 {object} publicSettingsResponse "Settings"
// @failure 500
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
