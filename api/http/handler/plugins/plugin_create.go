package plugins

import (
	"errors"
	"net/http"
	"os/exec"
	"strconv"

	"github.com/asaskevich/govalidator"
	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	"github.com/portainer/libhttp/response"
	"github.com/portainer/portainer"
	"github.com/portainer/portainer/archive"
	"github.com/portainer/portainer/http/client"
)

type pluginCreatePayload struct {
	License string
}

func (payload *pluginCreatePayload) Validate(r *http.Request) error {
	if govalidator.IsNull(payload.License) {
		return portainer.Error("Invalid license")
	}

	return nil
}

func (handler *Handler) pluginCreate(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	var payload pluginCreatePayload
	err := request.DecodeAndValidateJSONPayload(r, &payload)
	if err != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid request payload", err}
	}

	pluginIdentifier, err := strconv.Atoi(string(payload.License[0]))
	if err != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid license format", err}
	}
	pluginId := portainer.PluginID(pluginIdentifier)

	plugins, err := handler.PluginService.Plugins()
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve plugins status from the database", err}
	}

	for _, plugin := range plugins {
		if plugin.ID == pluginId {
			return &httperror.HandlerError{http.StatusConflict, "Unable to enable plugin", portainer.ErrPluginAlreadyEnabled}
		}
	}

	err = handler.enablePlugin(pluginId, payload.License)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to enable plugin", err}
	}

	p := &portainer.Plugin{
		ID:      pluginId,
		Enabled: true,
	}

	err = handler.PluginService.Persist(p)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to persist plugin status inside the database", err}
	}

	return response.Empty(w)
}

func (handler *Handler) enablePlugin(pluginID portainer.PluginID, license string) error {

	// TODO: switch case on plugin identifier to download/enable correct plugin
	switch pluginID {
	case portainer.RegistryManagementPlugin:
		return handler.enableRegistryManagementPlugin(pluginID, license)
	default:
		return errors.New("Unsupported plugin identifier")
	}

	// syscall.Exec replaces the process, ForkExec could be tried?
	// Also should be relocated to another package
	// err = syscall.ForkExec("/plugins/plugin-registry-management", []string{"plugin-registry-management"}, os.Environ())
	// cmd := exec.Command("/data/plugins/plugin-registry-management")
	// // cmd.Start will not share logs with the main Portainer container.
	// err := cmd.Start()
	// if err != nil {
	// 	return err
	// }

	return handler.ProxyManager.CreatePluginProxy(pluginID)
}

func (handler *Handler) enableRegistryManagementPlugin(pluginID portainer.PluginID, license string) error {
	// Download/untar
	// TODO: replace location + constant for base (download.portainer.io ?)
	// based on current platform+arch, should download the according zip (plugin-registry-manager-linux-amd64.zip)
	data, err := client.Get("https://github.com/deviantony/xtrabackup-scripts/releases/download/3.1.6/rm01.zip", 30)
	if err != nil {
		return err
	}

	err = archive.UnzipArchive(data, "/data/plugins")
	if err != nil {
		return err
	}

	// TODO: if license check fails, need to be updated to use flags

	licenseValidationCommand := exec.Command("/data/plugins/plugin-registry-management", license, "--check")
	err = licenseValidationCommand.Run()
	if err != nil {
		return portainer.Error("Invalid license")
	}

	// syscall.Exec replaces the process, ForkExec could be tried?
	// Also should be relocated to another package
	// err = syscall.ForkExec("/plugins/plugin-registry-management", []string{"plugin-registry-management"}, os.Environ())
	cmd := exec.Command("/data/plugins/plugin-registry-management", license)

	// cmd.Start will not share logs with the main Portainer container.
	err = cmd.Start()
	if err != nil {
		return err
	}

	return handler.ProxyManager.CreatePluginProxy(pluginID)
}
