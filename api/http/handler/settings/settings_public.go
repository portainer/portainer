package settings

import (
	"net/http"

	"github.com/portainer/portainer"
	httperror "github.com/portainer/portainer/http/error"
	"github.com/portainer/portainer/http/response"
)

type publicSettingsResponse struct {
	LogoURL                            string                         `json:"LogoURL"`
	AuthenticationMethod               portainer.AuthenticationMethod `json:"AuthenticationMethod"`
	AllowBindMountsForRegularUsers     bool                           `json:"AllowBindMountsForRegularUsers"`
	AllowPrivilegedModeForRegularUsers bool                           `json:"AllowPrivilegedModeForRegularUsers"`
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
	}

	return response.JSON(w, publicSettings)
}
