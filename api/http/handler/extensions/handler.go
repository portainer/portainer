package extensions

import (
	"net/http"

	"github.com/coreos/go-semver/semver"

	"github.com/gorilla/mux"
	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/http/security"
)

// Handler is the HTTP handler used to handle extension operations.
type Handler struct {
	*mux.Router
	ExtensionService     portainer.ExtensionService
	ExtensionManager     portainer.ExtensionManager
	EndpointGroupService portainer.EndpointGroupService
	EndpointService      portainer.EndpointService
	RegistryService      portainer.RegistryService
	AuthorizationService *portainer.AuthorizationService
}

// NewHandler creates a handler to manage extension operations.
func NewHandler(bouncer *security.RequestBouncer) *Handler {
	h := &Handler{
		Router: mux.NewRouter(),
	}

	h.Handle("/extensions",
		bouncer.RestrictedAccess(httperror.LoggerHandler(h.extensionList))).Methods(http.MethodGet)
	h.Handle("/extensions",
		bouncer.AdminAccess(httperror.LoggerHandler(h.extensionCreate))).Methods(http.MethodPost)
	h.Handle("/extensions/upload",
		bouncer.AdminAccess(httperror.LoggerHandler(h.extensionUpload))).Methods(http.MethodPost)
	h.Handle("/extensions/{id}",
		bouncer.AdminAccess(httperror.LoggerHandler(h.extensionInspect))).Methods(http.MethodGet)
	h.Handle("/extensions/{id}",
		bouncer.AdminAccess(httperror.LoggerHandler(h.extensionDelete))).Methods(http.MethodDelete)
	h.Handle("/extensions/{id}/update",
		bouncer.AdminAccess(httperror.LoggerHandler(h.extensionUpdate))).Methods(http.MethodPost)

	return h
}

func mergeExtensionsAndDefinitions(extensions, definitions []portainer.Extension) []portainer.Extension {
	for _, definition := range definitions {
		foundInDB := false

		for idx, extension := range extensions {
			if extension.ID == definition.ID {
				foundInDB = true
				mergeExtensionAndDefinition(&extensions[idx], &definition)
				break
			}
		}

		if !foundInDB {
			extensions = append(extensions, definition)
		}
	}

	return extensions
}

func mergeExtensionAndDefinition(extension, definition *portainer.Extension) {
	extension.Name = definition.Name
	extension.ShortDescription = definition.ShortDescription
	extension.Deal = definition.Deal
	extension.Available = definition.Available
	extension.DescriptionURL = definition.DescriptionURL
	extension.Images = definition.Images
	extension.Logo = definition.Logo
	extension.Price = definition.Price
	extension.PriceDescription = definition.PriceDescription
	extension.ShopURL = definition.ShopURL

	definitionVersion := semver.New(definition.Version)
	extensionVersion := semver.New(extension.Version)
	if extensionVersion.LessThan(*definitionVersion) {
		extension.UpdateAvailable = true
	}

	extension.Version = definition.Version
}
