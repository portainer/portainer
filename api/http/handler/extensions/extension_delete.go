package extensions

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

// DELETE request on /api/extensions/:id
func (handler *Handler) extensionDelete(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	extensionIdentifier, err := request.RetrieveNumericRouteVariableValue(r, "id")
	if err != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid extension identifier route variable", err}
	}
	extensionID := portainer.ExtensionID(extensionIdentifier)

	extension, err := handler.ExtensionService.Extension(extensionID)
	if err == portainer.ErrObjectNotFound {
		return &httperror.HandlerError{http.StatusNotFound, "Unable to find a extension with the specified identifier inside the database", err}
	} else if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to find a extension with the specified identifier inside the database", err}
	}

	err = handler.deleteExtension(extension)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to delete extension", err}
	}

	err = handler.ExtensionService.DeleteExtension(extensionID)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to delete the extension from the database", err}
	}

	return response.Empty(w)
}

func (handler *Handler) deleteExtension(extension *portainer.Extension) error {

	// TODO: switch case on extension identifier to download/enable correct extension
	switch extension.ID {
	case portainer.RegistryManagementExtension:
		return handler.deleteRegistryManagementExtension(extension)
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

func (handler *Handler) deleteRegistryManagementExtension(extension *portainer.Extension) error {

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

	handler.ExtensionProcesses.Remove(strconv.Itoa(int(extension.ID)))
	handler.ProxyManager.DeleteExtensionProxy(strconv.Itoa(int(extension.ID)))

	return nil
}
