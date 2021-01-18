package registries

import (
	"net/http"

	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	"github.com/portainer/libhttp/response"
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/bolt/errors"
)

// @id RegistryDelete
// @summary Remove a registry
// @description Remove a registry
// @description **Access policy**: administrator
// @tags registries
// @security jwt
// @param id path int true "Registry identifier"
// @success 204 "Success"
// @failure 400 "Invalid request"
// @failure 404 "Registry not found"
// @failure 500 "Server error"
// @router /registries/{id} [delete]
func (handler *Handler) registryDelete(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	registryID, err := request.RetrieveNumericRouteVariableValue(r, "id")
	if err != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid registry identifier route variable", err}
	}

	_, err = handler.DataStore.Registry().Registry(portainer.RegistryID(registryID))
	if err == errors.ErrObjectNotFound {
		return &httperror.HandlerError{http.StatusNotFound, "Unable to find a registry with the specified identifier inside the database", err}
	} else if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to find a registry with the specified identifier inside the database", err}
	}

	err = handler.DataStore.Registry().DeleteRegistry(portainer.RegistryID(registryID))
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to remove the registry from the database", err}
	}

	return response.Empty(w)
}
