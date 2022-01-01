package endpoints

// TODO: legacy extension management

import (
	"net/http"

	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	"github.com/portainer/libhttp/response"
	portainer "github.com/portainer/portainer/api"
)

// @id endpointExtensionRemove
// @tags endpoints
// @deprecated
// @param id path int true "Environment(Endpoint) identifier"
// @param extensionType path string true "Extension Type"
// @success 204 "Success"
// @router /endpoints/{id}/extensions/{extensionType} [delete]
func (handler *Handler) endpointExtensionRemove(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	endpointID, err := request.RetrieveNumericRouteVariableValue(r, "id")
	if err != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid environment identifier route variable", err}
	}

	endpoint, err := handler.DataStore.Endpoint().Endpoint(portainer.EndpointID(endpointID))
	if handler.DataStore.IsErrObjectNotFound(err) {
		return &httperror.HandlerError{http.StatusNotFound, "Unable to find an environment with the specified identifier inside the database", err}
	} else if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to find an environment with the specified identifier inside the database", err}
	}

	extensionType, err := request.RetrieveNumericRouteVariableValue(r, "extensionType")
	if err != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid extension type route variable", err}
	}

	for idx, ext := range endpoint.Extensions {
		if ext.Type == portainer.EndpointExtensionType(extensionType) {
			endpoint.Extensions = append(endpoint.Extensions[:idx], endpoint.Extensions[idx+1:]...)
		}
	}

	err = handler.DataStore.Endpoint().UpdateEndpoint(endpoint.ID, endpoint)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to persist environment changes inside the database", err}
	}

	return response.Empty(w)
}
