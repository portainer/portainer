package registries

import (
	"net/http"

	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/response"
	"github.com/portainer/portainer/api/http/security"
)

// @summary List Registries
// @description
// @tags Registries
// @security ApiKeyAuth
// @accept json
// @produce json
// @success 200 {array} portainer.Registry "Registry"
// @failure 500
// @router /registries [get]
func (handler *Handler) registryList(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	registries, err := handler.DataStore.Registry().Registries()
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve registries from the database", err}
	}

	securityContext, err := security.RetrieveRestrictedRequestContext(r)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve info from request context", err}
	}

	filteredRegistries := security.FilterRegistries(registries, securityContext)

	for idx := range filteredRegistries {
		hideFields(&filteredRegistries[idx])
	}

	return response.JSON(w, filteredRegistries)
}
