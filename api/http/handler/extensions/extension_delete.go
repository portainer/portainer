package extensions

import (
	"net/http"

	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	"github.com/portainer/libhttp/response"
	"github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/bolt/errors"
)

// DELETE request on /api/extensions/:id
func (handler *Handler) extensionDelete(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	extensionIdentifier, err := request.RetrieveNumericRouteVariableValue(r, "id")
	if err != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid extension identifier route variable", err}
	}
	extensionID := portainer.ExtensionID(extensionIdentifier)

	extension, err := handler.DataStore.Extension().Extension(extensionID)
	if err == errors.ErrObjectNotFound {
		return &httperror.HandlerError{http.StatusNotFound, "Unable to find a extension with the specified identifier inside the database", err}
	} else if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to find a extension with the specified identifier inside the database", err}
	}

	err = handler.ExtensionManager.DisableExtension(extension)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to delete extension", err}
	}

	err = handler.DataStore.Extension().DeleteExtension(extensionID)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to delete the extension from the database", err}
	}

	return response.Empty(w)
}
