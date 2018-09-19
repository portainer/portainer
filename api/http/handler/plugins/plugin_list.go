package plugins

import (
	"net/http"

	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/response"
	"github.com/portainer/portainer/http/client"
)

// GET request on /api/plugins
func (handler *Handler) pluginList(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	// var templates []portainer.Template

	// var templateData []byte
	// TODO: constant
	pluginData, err := client.Get("https://gist.githubusercontent.com/deviantony/d1d0d59fa1b5d8fbc1c988ee51f9ff84/raw/018bb35bde71cd85c79f43c4c05ff61a875ed4bd/plugins.json")
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve plugin definitions", err}
	}

	// err = json.Unmarshal(templateData, &templates)
	// if err != nil {
	// 	return &httperror.HandlerError{http.StatusInternalServerError, "Unable to parse external templates", err}
	// }

	return response.JSON(w, pluginData)
}
