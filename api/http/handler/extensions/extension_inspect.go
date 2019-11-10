package extensions

import (
	"encoding/json"
	"log"
	"net/http"

	"github.com/coreos/go-semver/semver"
	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	"github.com/portainer/libhttp/response"
	"github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/http/client"
)

// GET request on /api/extensions/:id
func (handler *Handler) extensionInspect(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	extensionIdentifier, err := request.RetrieveNumericRouteVariableValue(r, "id")
	if err != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid extension identifier route variable", err}
	}
	extensionID := portainer.ExtensionID(extensionIdentifier)

	storedExtension, err := handler.ExtensionService.Extension(extensionID)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to find a extension with the specified identifier inside the database", err}
	}

	extensionData, err := client.Get(portainer.ExtensionDefinitionsURL, 10)
	if err != nil {
		log.Printf("[WARN] [http,extensions] [message: unable to retrieve extension manifest via Internet] [err: %s]", err)
		return response.JSON(w, storedExtension)
	}

	var extensions []portainer.Extension
	err = json.Unmarshal(extensionData, &extensions)
	if err != nil {
		log.Printf("[WARN] [http,extensions] [message: unable to retrieve extension information via Internet] [err: %s]", err)
		return response.JSON(w, storedExtension)
	}

	var extension portainer.Extension
	for _, p := range extensions {
		if p.ID == extensionID {
			extension = p
			if extension.DescriptionURL != "" {
				description, _ := client.Get(extension.DescriptionURL, 10)
				extension.Description = string(description)
			}
			break
		}
	}

	extension.Enabled = storedExtension.Enabled

	extensionVer := semver.New(extension.Version)
	pVer := semver.New(storedExtension.Version)

	if pVer.LessThan(*extensionVer) {
		extension.UpdateAvailable = true
	}

	return response.JSON(w, extension)
}
