package extensions

import (
	"net/http"

	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	"github.com/portainer/libhttp/response"
)

// GET request on /api/extensions?store=<store>
func (handler *Handler) extensionList(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	fetchManifestInformation, _ := request.RetrieveBooleanQueryParameter(r, "store", true)

	extensions, err := handler.ExtensionService.Extensions()
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve extensions from the database", err}
	}

	if fetchManifestInformation {
		definitions, err := handler.ExtensionManager.FetchExtensionDefinitions()
		if err != nil {
			return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve extensions informations", err}
		}

		extensions = mergeExtensionsAndDefinitions(extensions, definitions)
	}

	return response.JSON(w, extensions)
}
