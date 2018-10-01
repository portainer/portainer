package plugins

import (
	"bytes"
	"errors"
	"net/http"
	"os/exec"
	"strconv"
	"strings"

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

	p := &portainer.Plugin{
		ID: pluginId,
	}

	err = handler.enablePlugin(p, payload.License)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to enable plugin", err}
	}

	p.Enabled = true

	err = handler.PluginService.Persist(p)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to persist plugin status inside the database", err}
	}

	return response.Empty(w)
}

func (handler *Handler) enablePlugin(plugin *portainer.Plugin, license string) error {

	// TODO: switch case on plugin identifier to download/enable correct plugin
	switch plugin.ID {
	case portainer.RegistryManagementPlugin:
		return handler.enableRegistryManagementPlugin(plugin, license)
	default:
		return errors.New("Unsupported plugin identifier")
	}

	// syscall.Exec replaces the process, ForkExec could be tried?
	// Also should be relocated to another package
	// err = syscall.ForkExec("/plugins/plugin-registry-management", []string{"plugin-registry-management"}, os.Environ())
	// cmd := exec.Command("/data/bin/plugin-registry-management")
	// // cmd.Start will not share logs with the main Portainer container.
	// err := cmd.Start()
	// if err != nil {
	// 	return err
	// }

	return nil
}

func (handler *Handler) enableRegistryManagementPlugin(plugin *portainer.Plugin, license string) error {
	// Download/untar
	// TODO: replace location + constant for base (download.portainer.io ?)
	// based on current platform+arch, should download the according zip (plugin-registry-manager-linux-amd64.zip)
	data, err := client.Get("https://github.com/deviantony/xtrabackup-scripts/releases/download/3.1.5/rm01.zip", 30)
	if err != nil {
		return err
	}

	// TODO: shoudd be relocated to another package, also use data folder constant (windows/linux differs)
	err = archive.UnzipArchive(data, "/data/bin")
	if err != nil {
		return err
	}

	// TODO: if license check fails, need to be updated to use flags
	// should probably download and use a specific license-checker binary

	licenseValidationCommand := exec.Command("/data/bin/plugin-registry-management", license, "--check")
	cmdOutput := &bytes.Buffer{}
	licenseValidationCommand.Stdout = cmdOutput

	err = licenseValidationCommand.Run()
	if err != nil {
		return portainer.Error("Invalid license")
	}

	plugin.License = license

	output := string(cmdOutput.Bytes())
	licenseDetails := strings.Split(output, "|")
	plugin.LicenseCompany = licenseDetails[0]
	plugin.LicenseExpiration = licenseDetails[1]
	plugin.Version = licenseDetails[2]

	// syscall.Exec replaces the process, ForkExec could be tried?
	// Also should be relocated to another package
	// err = syscall.ForkExec("/plugins/plugin-registry-management", []string{"plugin-registry-management"}, os.Environ())
	cmd := exec.Command("/data/bin/plugin-registry-management", license)

	// cmd.Start will not share logs with the main Portainer container.
	err = cmd.Start()
	if err != nil {
		return err
	}

	handler.PluginProcesses.Set(strconv.Itoa(int(plugin.ID)), cmd)

	return handler.ProxyManager.CreatePluginProxy(plugin.ID)
}
