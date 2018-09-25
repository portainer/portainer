package plugins

import (
	"encoding/json"
	"net/http"

	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	"github.com/portainer/libhttp/response"
	"github.com/portainer/portainer"
	"github.com/portainer/portainer/http/client"
)

// GET request on /api/plugins?store
func (handler *Handler) pluginList(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {

	storeDetails, _ := request.RetrieveBooleanQueryParameter(r, "store", true)
	if storeDetails {
		// TODO: store somewhere else + constant
		pluginData, err := client.Get("https://gist.githubusercontent.com/deviantony/d1d0d59fa1b5d8fbc1c988ee51f9ff84/raw/74ea9046867d4379c982e7c0df3dae1d6e828a99/plugins.json", 30)
		if err != nil {
			return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve plugin definitions", err}
		}

		var plugins []portainer.Plugin
		err = json.Unmarshal(pluginData, &plugins)
		if err != nil {
			return &httperror.HandlerError{http.StatusInternalServerError, "Unable to parse external plugin definitions", err}
		}

		storedPlugins, err := handler.PluginService.Plugins()
		if err != nil {
			return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve plugins status from the database", err}
		}

		// TODO: refactor?
		for idx := range plugins {
			for _, p := range storedPlugins {
				if plugins[idx].ID == p.ID {
					plugins[idx].Enabled = p.Enabled
					plugins[idx].LicenseCompany = p.LicenseCompany
					plugins[idx].LicenseExpiration = p.LicenseExpiration
					break
				}
			}
		}

		return response.JSON(w, plugins)
	}

	plugins, err := handler.PluginService.Plugins()
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve plugins status from the database", err}
	}

	return response.JSON(w, plugins)
}
