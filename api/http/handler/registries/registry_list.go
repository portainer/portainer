package registries

import (
	"net/http"

	httperror "github.com/portainer/portainer/http/error"
	"github.com/portainer/portainer/http/response"
	"github.com/portainer/portainer/http/security"
)

// GET request on /api/registries
func (handler *Handler) registryList(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	registries, err := handler.RegistryService.Registries()
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve registries from the database", err}
	}

	securityContext, err := security.RetrieveRestrictedRequestContext(r)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve info from request context", err}
	}

	filteredRegistries := security.FilterRegistries(registries, securityContext)

	for _, registry := range filteredRegistries {
		hideFields(&registry)
	}
	return response.JSON(w, registries)
}
