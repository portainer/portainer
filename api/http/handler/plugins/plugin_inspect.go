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

// GET request on /api/plugins/:id
func (handler *Handler) pluginInspect(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	pluginIdentifier, err := request.RetrieveNumericRouteVariableValue(r, "id")
	if err != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid plugin identifier route variable", err}
	}
	pluginID := portainer.PluginID(pluginIdentifier)

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

	var plugin portainer.Plugin
	for _, p := range plugins {
		if p.ID == pluginID {
			plugin = p
			break
		}
	}

	return response.JSON(w, plugin)
}
