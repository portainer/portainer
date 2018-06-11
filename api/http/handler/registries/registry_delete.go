package registries

import (
	"net/http"

	"github.com/portainer/portainer"
	httperror "github.com/portainer/portainer/http/error"
	"github.com/portainer/portainer/http/request"
	"github.com/portainer/portainer/http/response"
)

// DELETE request on /api/registries/:id
func (handler *Handler) registryDelete(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	registryID, err := request.RetrieveNumericRouteVariableValue(r, "id")
	if err != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid registry identifier route variable", err}
	}

	_, err = handler.RegistryService.Registry(portainer.RegistryID(registryID))
	if err == portainer.ErrEndpointGroupNotFound {
		return &httperror.HandlerError{http.StatusNotFound, "Unable to find a registry with the specified identifier inside the database", err}
	} else if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to find a registry with the specified identifier inside the database", err}
	}

	err = handler.RegistryService.DeleteRegistry(portainer.RegistryID(registryID))
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to remove the registry from the database", err}
	}

	return response.Empty(w)
}
