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

	// syscall.Exec replaces the process, ForkExec could be tried?
	// err = syscall.ForkExec("/plugins/plugin-registry-management", []string{"plugin-registry-management"}, os.Environ())
	cmd := exec.Command("/plugins/plugin-registry-management")
	// cmd.Start will not share logs with the main Portainer container.
	err = cmd.Start()
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to execute plugin", err}
	}

	_, err = handler.ProxyManager.CreatePluginProxy(portainer.PluginType(payload.PluginType))
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to create proxy for the plugin", err}
	}

	return response.Empty(w)
}
