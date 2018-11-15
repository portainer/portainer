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

type extensionCreatePayload struct {
	License string
}

func (payload *extensionCreatePayload) Validate(r *http.Request) error {
	if govalidator.IsNull(payload.License) {
		return portainer.Error("Invalid license")
	}

	return nil
}

func (handler *Handler) extensionCreate(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	var payload extensionCreatePayload
	err := request.DecodeAndValidateJSONPayload(r, &payload)
	if err != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid request payload", err}
	}

	extensionIdentifier, err := strconv.Atoi(string(payload.License[0]))
	if err != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid license format", err}
	}
	extensionId := portainer.ExtensionID(extensionIdentifier)

	extensions, err := handler.ExtensionService.Extensions()
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve extensions status from the database", err}
	}

	for _, extension := range extensions {
		if extension.ID == extensionId {
			return &httperror.HandlerError{http.StatusConflict, "Unable to enable extension", portainer.ErrExtensionAlreadyEnabled}
		}
	}

	p := &portainer.Extension{
		ID: extensionId,
	}

	err = handler.enableExtension(p, payload.License)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to enable extension", err}
	}

	p.Enabled = true

	err = handler.ExtensionService.Persist(p)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to persist extension status inside the database", err}
	}

	return response.Empty(w)
}

func (handler *Handler) enableExtension(extension *portainer.Extension, license string) error {

	// TODO: switch case on extension identifier to download/enable correct extension
	switch extension.ID {
	case portainer.RegistryManagementExtension:
		return handler.enableRegistryManagementExtension(extension, license)
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

func (handler *Handler) enableRegistryManagementExtension(extension *portainer.Extension, license string) error {
	// Download/untar
	// TODO: replace location + constant for base (download.portainer.io ?)
	// based on current platform+arch, should download the according zip (extension-registry-manager-linux-amd64.zip)
	data, err := client.Get("https://portainer-io-assets.sfo2.digitaloceanspaces.com/extensions/extension-registry-management-linux-amd64-1.0.0.zip", 30)
	if err != nil {
		return err
	}

	// TODO: shoudd be relocated to another package, also use data folder constant (windows/linux differs)
	err = archive.UnzipArchive(data, "/data/bin")
	if err != nil {
		return err
	}

	licenseValidationCommand := exec.Command("/data/bin/extension-registry-management-linux-amd64-1.0.0", "-license", license, "-check")
	cmdOutput := &bytes.Buffer{}
	licenseValidationCommand.Stdout = cmdOutput

	err = licenseValidationCommand.Run()
	if err != nil {
		return portainer.Error("Invalid license")
	}

	extension.License = license

	output := string(cmdOutput.Bytes())
	licenseDetails := strings.Split(output, "|")
	extension.LicenseCompany = licenseDetails[0]
	extension.LicenseExpiration = licenseDetails[1]
	extension.Version = licenseDetails[2]

	// TODO: find the correct way to start the extension process
	// syscall.Exec replaces the process, ForkExec could be tried?
	// Also should be relocated to another package
	// err = syscall.ForkExec("/extensions/extension-registry-management", []string{"extension-registry-management"}, os.Environ())

	// TODO: logs must be available (redirect on FS?)
	cmd := exec.Command("/data/bin/extension-registry-management-linux-amd64-1.0.0", "-license", license)

	// cmd.Start will not share logs with the main Portainer container.
	err = cmd.Start()
	if err != nil {
		return err
	}

	handler.ExtensionProcesses.Set(strconv.Itoa(int(extension.ID)), cmd)

	return handler.ProxyManager.CreateExtensionProxy(extension.ID)
}
