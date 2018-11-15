package extensions

import (
	"encoding/json"
	"net/http"

	"github.com/coreos/go-semver/semver"
	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	"github.com/portainer/libhttp/response"
	"github.com/portainer/portainer"
	"github.com/portainer/portainer/http/client"
)

// GET request on /api/extensions?store=<store>
func (handler *Handler) extensionList(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {

	storeDetails, _ := request.RetrieveBooleanQueryParameter(r, "store", true)
	if storeDetails {
		extensionData, err := client.Get(portainer.ExtensionDefinitionsURL, 30)
		if err != nil {
			return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve extension definitions", err}
		}

		var extensions []portainer.Extension
		err = json.Unmarshal(extensionData, &extensions)
		if err != nil {
			return &httperror.HandlerError{http.StatusInternalServerError, "Unable to parse external extension definitions", err}
		}

		storedExtensions, err := handler.ExtensionService.Extensions()
		if err != nil {
			return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve extensions status from the database", err}
		}

		// TODO: refactor?
		for idx := range extensions {
			for _, p := range storedExtensions {
				if extensions[idx].ID == p.ID {
					extensions[idx].Enabled = p.Enabled
					extensions[idx].LicenseCompany = p.LicenseCompany
					extensions[idx].LicenseExpiration = p.LicenseExpiration

					extensionVer := semver.New(extensions[idx].Version)
					pVer := semver.New(p.Version)

					if pVer.LessThan(*extensionVer) {
						extensions[idx].UpdateAvailable = true
					}

					break
				}
			}
		}

		return response.JSON(w, extensions)
	}

	extensions, err := handler.ExtensionService.Extensions()
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve extensions status from the database", err}
	}

	return response.JSON(w, extensions)
}
