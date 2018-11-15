package extensions

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

type extensionUpdatePayload struct {
	Version string
}

func (payload *extensionUpdatePayload) Validate(r *http.Request) error {
	if govalidator.IsNull(payload.Version) {
		return portainer.Error("Invalid extension version")
	}

	return nil
}

func (handler *Handler) extensionUpdate(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	extensionIdentifier, err := request.RetrieveNumericRouteVariableValue(r, "id")
	if err != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid extension identifier route variable", err}
	}
	extensionID := portainer.ExtensionID(extensionIdentifier)

	var payload extensionUpdatePayload
	err = request.DecodeAndValidateJSONPayload(r, &payload)
	if err != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid request payload", err}
	}

	extension, err := handler.ExtensionService.Extension(extensionID)
	if err == portainer.ErrObjectNotFound {
		return &httperror.HandlerError{http.StatusNotFound, "Unable to find a extension with the specified identifier inside the database", err}
	} else if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to find a extension with the specified identifier inside the database", err}
	}

	// TODO: remove existing extension and upgrade to the new version
	err = handler.updateExtension(extension)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to update extension", err}
	}

	err = handler.ExtensionService.Persist(extension)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to persist extension status inside the database", err}
	}

	return response.Empty(w)
}

func (handler *Handler) updateExtension(extension *portainer.Extension) error {

	// TODO: switch case on extension identifier to download/enable correct extension
	switch extension.ID {
	case portainer.RegistryManagementExtension:
		return handler.updateRegistryManagementExtension(extension)
	default:
		return errors.New("Unsupported extension identifier")
	}

	// syscall.Exec replaces the process, ForkExec could be tried?
	// Also should be relocated to another package
	// err = syscall.ForkExec("/extensions/extension-registry-management", []string{"extension-registry-management"}, os.Environ())
	// cmd := exec.Command("/data/bin/extension-registry-management-linux-amd64-1.0.0")
	// // cmd.Start will not share logs with the main Portainer container.
	// err := cmd.Start()
	// if err != nil {
	// 	return err
	// }

	return nil
}

func (handler *Handler) updateRegistryManagementExtension(extension *portainer.Extension) error {

	// TODO: kill/remove actual process/binary should be done after download/extract step
	// so that if any issue arises during download/extract, we still have the extension running
	// Cannot do right now as there is a name conflict on the binary, need version in binary name

	// TODO: stop the current process associated to the extension
	// to do so, must keep a reference to the exec.Command that was started in extension_create (stored in the handler, might be relocated to a service after)
	process, ok := handler.ExtensionProcesses.Get(strconv.Itoa(int(extension.ID)))
	if ok {
		err := process.(*exec.Cmd).Process.Kill()
		if err != nil {
			return err
		}
	}

	// TODO: remove the existing extension binary from the filesystem
	err := handler.FileService.RemoveDirectory("/data/bin/extension-registry-management-linux-amd64-1.0.0")
	if err != nil {
		return err
	}

	// Download/untar
	// TODO: replace location + constant for base (download.portainer.io ?)
	// based on current platform+arch+version, should download the according zip (extension-registry-management-linux-amd64-1.0.1.zip)
	data, err := client.Get("https://portainer-io-assets.sfo2.digitaloceanspaces.com/extensions/extension-registry-management-linux-amd64-1.0.0.zip", 30)
	if err != nil {
		return err
	}

	// TODO: shoudd be relocated to another package, also use data folder constant (windows/linux differs)
	err = archive.UnzipArchive(data, "/data/bin")
	if err != nil {
		return err
	}

	licenseValidationCommand := exec.Command("/data/bin/extension-registry-management-linux-amd64-1.0.0", "-license", extension.License, "-check")
	cmdOutput := &bytes.Buffer{}
	licenseValidationCommand.Stdout = cmdOutput

	err = licenseValidationCommand.Run()
	if err != nil {
		return portainer.Error("Invalid license")
	}

	output := string(cmdOutput.Bytes())
	licenseDetails := strings.Split(output, "|")
	extension.LicenseCompany = licenseDetails[0]
	extension.LicenseExpiration = licenseDetails[1]
	extension.Version = licenseDetails[2]

	// syscall.Exec replaces the process, ForkExec could be tried?
	// Also should be relocated to another package
	// err = syscall.ForkExec("/extensions/extension-registry-management", []string{"extension-registry-management"}, os.Environ())
	cmd := exec.Command("/data/bin/extension-registry-management-linux-amd64-1.0.0", "-license", extension.License)

	// cmd.Start will not share logs with the main Portainer container.
	err = cmd.Start()
	if err != nil {
		return err
	}

	handler.ExtensionProcesses.Set(strconv.Itoa(int(extension.ID)), cmd)

	return handler.ProxyManager.CreateExtensionProxy(extension.ID)
}
