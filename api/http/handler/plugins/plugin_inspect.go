package plugins

import (
	"encoding/json"
	"log"
	"net/http"

	"github.com/coreos/go-semver/semver"
	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	"github.com/portainer/libhttp/response"
	"github.com/portainer/portainer"
	"github.com/portainer/portainer/http/client"
)

// GET request on /api/plugins/:id
func (handler *Handler) pluginInspect(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	pluginIdentifier, err := request.RetrieveNumericRouteVariableValue(r, "id")
	if err != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid plugin identifier route variable", err}
	}
	pluginID := portainer.PluginID(pluginIdentifier)

	// TODO: store somewhere else + constant
	pluginData, err := client.Get("https://gist.githubusercontent.com/deviantony/d1d0d59fa1b5d8fbc1c988ee51f9ff84/raw/115d49fc3474993bc6872417546a83acb65f5b77/plugins.json", 30)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve plugin definitions", err}
	}

	var plugins []portainer.Plugin
	err = json.Unmarshal(pluginData, &plugins)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to parse external plugin definitions", err}
	}

	var plugin portainer.Plugin
	for _, p := range plugins {
		if p.ID == pluginID {
			plugin = p
			break
		}
	}

	storedPlugin, err := handler.PluginService.Plugin(pluginID)
	if err == portainer.ErrObjectNotFound {
		return response.JSON(w, plugin)
	} else if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to find a plugin with the specified identifier inside the database", err}
	}

	plugin.Enabled = storedPlugin.Enabled

	pluginVer := semver.New(plugin.Version)
	log.Println(plugin.Version)
	pVer := semver.New(storedPlugin.Version)
	log.Println(storedPlugin.Version)

	if pVer.LessThan(*pluginVer) {
		plugin.UpdateAvailable = true
	}

	return response.JSON(w, plugin)
}
