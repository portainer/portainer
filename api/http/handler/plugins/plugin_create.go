package plugins

import (
	"net/http"
	"os/exec"

	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	"github.com/portainer/libhttp/response"
	"github.com/portainer/portainer"
)

type pluginCreatePayload struct {
	PluginType int
}

func (payload *pluginCreatePayload) Validate(r *http.Request) error {
	if payload.PluginType == 0 {
		return portainer.Error("Invalid plugin type")
	}
	return nil
}

func (handler *Handler) pluginCreate(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	var payload pluginCreatePayload
	err := request.DecodeAndValidateJSONPayload(r, &payload)
	if err != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid request payload", err}
	}

	pluginType := portainer.PluginType(payload.PluginType)

	for _, enabledPlugin := range handler.status.EnabledPlugins {
		if enabledPlugin == pluginType {
			return &httperror.HandlerError{http.StatusConflict, "Unable to enable plugin", portainer.ErrPluginAlreadyEnabled}
		}
	}

	err = handler.enablePlugin(pluginType)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to enable plugin", err}
	}

	handler.status.EnabledPlugins = append(handler.status.EnabledPlugins, pluginType)
	return response.Empty(w)
}

func (handler *Handler) enablePlugin(pluginType portainer.PluginType) error {

	// TODO: switch case on plugin type to download/enable correct plugin

	// syscall.Exec replaces the process, ForkExec could be tried?
	// Also should be relocated to another package
	// err = syscall.ForkExec("/plugins/plugin-registry-management", []string{"plugin-registry-management"}, os.Environ())
	cmd := exec.Command("/data/plugins/plugin-registry-management")
	// cmd.Start will not share logs with the main Portainer container.
	err := cmd.Start()
	if err != nil {
		return err
	}

	return handler.ProxyManager.CreatePluginProxy(pluginType)
}
