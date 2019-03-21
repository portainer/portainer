package extensions

import (
	"net/http"

	"github.com/coreos/go-semver/semver"
	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	"github.com/portainer/libhttp/response"
	"github.com/portainer/portainer/api"
)

// GET request on /api/extensions?store=<store>
func (handler *Handler) extensionList(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	storeDetails, _ := request.RetrieveBooleanQueryParameter(r, "store", true)

	extensions, err := handler.ExtensionService.Extensions()
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve extensions from the database", err}
	}

	if storeDetails {
		definitions, err := handler.ExtensionManager.FetchExtensionDefinitions()
		if err != nil {
			return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve extensions", err}
		}

		for idx := range definitions {
			associateExtensionData(&definitions[idx], extensions)
		}

		extensions = definitions
	}

	return response.JSON(w, extensions)
}

func associateExtensionData(definition *portainer.Extension, extensions []portainer.Extension) {
	for _, extension := range extensions {
		if extension.ID == definition.ID {

			definition.Enabled = extension.Enabled
			definition.License.Company = extension.License.Company
			definition.License.Expiration = extension.License.Expiration
			definition.License.Valid = extension.License.Valid

			definitionVersion := semver.New(definition.Version)
			extensionVersion := semver.New(extension.Version)
			if extensionVersion.LessThan(*definitionVersion) {
				definition.UpdateAvailable = true
			}

			break
		}
	}
}
