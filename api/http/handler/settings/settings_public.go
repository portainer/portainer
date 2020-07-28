package settings

import (
	"fmt"
	"net/http"

	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/response"
	portainer "github.com/portainer/portainer/api"
)

type publicSettingsResponse struct {
	LogoURL                                   string                         `json:"LogoURL"`
	AuthenticationMethod                      portainer.AuthenticationMethod `json:"AuthenticationMethod"`
	AllowBindMountsForRegularUsers            bool                           `json:"AllowBindMountsForRegularUsers"`
	AllowPrivilegedModeForRegularUsers        bool                           `json:"AllowPrivilegedModeForRegularUsers"`
	AllowVolumeBrowserForRegularUsers         bool                           `json:"AllowVolumeBrowserForRegularUsers"`
	AllowHostNamespaceForRegularUsers         bool                           `json:"AllowHostNamespaceForRegularUsers"`
	AllowDeviceMappingForRegularUsers         bool                           `json:"AllowDeviceMappingForRegularUsers"`
	AllowStackManagementForRegularUsers       bool                           `json:"AllowStackManagementForRegularUsers"`
	AllowContainerCapabilitiesForRegularUsers bool                           `json:"AllowContainerCapabilitiesForRegularUsers"`
	EnableHostManagementFeatures              bool                           `json:"EnableHostManagementFeatures"`
	EnableEdgeComputeFeatures                 bool                           `json:"EnableEdgeComputeFeatures"`
	OAuthLoginURI                             string                         `json:"OAuthLoginURI"`
}

// GET request on /api/settings/public
func (handler *Handler) settingsPublic(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	settings, err := handler.DataStore.Settings().Settings()
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve the settings from the database", err}
	}

	publicSettings := &publicSettingsResponse{
		LogoURL:                                   settings.LogoURL,
		AuthenticationMethod:                      settings.AuthenticationMethod,
		AllowBindMountsForRegularUsers:            settings.AllowBindMountsForRegularUsers,
		AllowPrivilegedModeForRegularUsers:        settings.AllowPrivilegedModeForRegularUsers,
		AllowVolumeBrowserForRegularUsers:         settings.AllowVolumeBrowserForRegularUsers,
		AllowHostNamespaceForRegularUsers:         settings.AllowHostNamespaceForRegularUsers,
		AllowDeviceMappingForRegularUsers:         settings.AllowDeviceMappingForRegularUsers,
		AllowStackManagementForRegularUsers:       settings.AllowStackManagementForRegularUsers,
		AllowContainerCapabilitiesForRegularUsers: settings.AllowContainerCapabilitiesForRegularUsers,
		EnableHostManagementFeatures:              settings.EnableHostManagementFeatures,
		EnableEdgeComputeFeatures:                 settings.EnableEdgeComputeFeatures,
		OAuthLoginURI: fmt.Sprintf("%s?response_type=code&client_id=%s&redirect_uri=%s&scope=%s&prompt=login",
			settings.OAuthSettings.AuthorizationURI,
			settings.OAuthSettings.ClientID,
			settings.OAuthSettings.RedirectURI,
			settings.OAuthSettings.Scopes),
	}

	return response.JSON(w, publicSettings)
}
