package plugins

import (
	"encoding/json"
	"net/http"

	"github.com/coreos/go-semver/semver"
	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	"github.com/portainer/libhttp/response"
	"github.com/portainer/portainer"
	"github.com/portainer/portainer/http/client"
)

// GET request on /api/plugins?store=<store>
func (handler *Handler) pluginList(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {

	storeDetails, _ := request.RetrieveBooleanQueryParameter(r, "store", true)
	if storeDetails {
		pluginData, err := client.Get(portainer.PluginDefinitionsURL, 30)
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

					pluginVer := semver.New(plugins[idx].Version)
					pVer := semver.New(p.Version)

					if pVer.LessThan(*pluginVer) {
						plugins[idx].UpdateAvailable = true
					}

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
