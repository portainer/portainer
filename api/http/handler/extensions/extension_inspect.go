package extensions

import (
	"github.com/portainer/portainer/api/bolt/errors"
	"net/http"

	"github.com/portainer/portainer/api/http/client"

	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	"github.com/portainer/libhttp/response"
	"github.com/portainer/portainer/api"
)

// GET request on /api/extensions/:id
func (handler *Handler) extensionInspect(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	extensionIdentifier, err := request.RetrieveNumericRouteVariableValue(r, "id")
	if err != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid extension identifier route variable", err}
	}

	extensionID := portainer.ExtensionID(extensionIdentifier)

	definitions, err := handler.ExtensionManager.FetchExtensionDefinitions()
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve extensions informations", err}
	}

	localExtension, err := handler.DataStore.Extension().Extension(extensionID)
	if err != nil && err != errors.ErrObjectNotFound {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve extension information from the database", err}
	}

	var extension portainer.Extension
	var extensionDefinition portainer.Extension

	for _, definition := range definitions {
		if definition.ID == extensionID {
			extensionDefinition = definition
			break
		}
	}

	if localExtension == nil {
		extension = extensionDefinition
	} else {
		extension = *localExtension
	}

	mergeExtensionAndDefinition(&extension, &extensionDefinition)

	description, _ := client.Get(extension.DescriptionURL, 5)
	extension.Description = string(description)

	return response.JSON(w, extension)
}
