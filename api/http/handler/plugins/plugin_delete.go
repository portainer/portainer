package plugins

import (
	"errors"
	"net/http"
	"os/exec"
	"strconv"

	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	"github.com/portainer/libhttp/response"
	"github.com/portainer/portainer"
)

// DELETE request on /api/plugins/:id
func (handler *Handler) pluginDelete(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	pluginIdentifier, err := request.RetrieveNumericRouteVariableValue(r, "id")
	if err != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid plugin identifier route variable", err}
	}
	pluginID := portainer.PluginID(pluginIdentifier)

	plugin, err := handler.PluginService.Plugin(pluginID)
	if err == portainer.ErrObjectNotFound {
		return &httperror.HandlerError{http.StatusNotFound, "Unable to find a plugin with the specified identifier inside the database", err}
	} else if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to find a plugin with the specified identifier inside the database", err}
	}

	err = handler.deletePlugin(plugin)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to delete plugin", err}
	}

	err = handler.PluginService.DeletePlugin(pluginID)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to delete the plugin from the database", err}
	}

	return response.Empty(w)
}

func (handler *Handler) deletePlugin(plugin *portainer.Plugin) error {

	// TODO: switch case on plugin identifier to download/enable correct plugin
	switch plugin.ID {
	case portainer.RegistryManagementPlugin:
		return handler.deleteRegistryManagementPlugin(plugin)
	default:
		return errors.New("Unsupported plugin identifier")
	}

	// syscall.Exec replaces the process, ForkExec could be tried?
	// Also should be relocated to another package
	// err = syscall.ForkExec("/plugins/plugin-registry-management", []string{"plugin-registry-management"}, os.Environ())
	// cmd := exec.Command("/data/bin/plugin-registry-management-linux-amd64-1.0.0")
	// // cmd.Start will not share logs with the main Portainer container.
	// err := cmd.Start()
	// if err != nil {
	// 	return err
	// }

	return nil
}

func (handler *Handler) deleteRegistryManagementPlugin(plugin *portainer.Plugin) error {

	// TODO: kill/remove actual process/binary should be done after download/extract step
	// so that if any issue arises during download/extract, we still have the plugin running
	// Cannot do right now as there is a name conflict on the binary, need version in binary name

	// TODO: stop the current process associated to the plugin
	// to do so, must keep a reference to the exec.Command that was started in plugin_create (stored in the handler, might be relocated to a service after)
	process, ok := handler.PluginProcesses.Get(strconv.Itoa(int(plugin.ID)))
	if ok {
		err := process.(*exec.Cmd).Process.Kill()
		if err != nil {
			return err
		}
	}

	// TODO: remove the existing plugin binary from the filesystem
	err := handler.FileService.RemoveDirectory("/data/bin/plugin-registry-management-linux-amd64-1.0.0")
	if err != nil {
		return err
	}

	handler.PluginProcesses.Remove(strconv.Itoa(int(plugin.ID)))
	handler.ProxyManager.DeletePluginProxy(strconv.Itoa(int(plugin.ID)))

	return nil
}
