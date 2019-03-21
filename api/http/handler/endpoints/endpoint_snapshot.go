package endpoints

import (
	"net/http"

	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	"github.com/portainer/libhttp/response"
	"github.com/portainer/portainer/api"
)

// POST request on /api/endpoints/:id/snapshot
func (handler *Handler) endpointSnapshot(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	endpointID, err := request.RetrieveNumericRouteVariableValue(r, "id")
	if err != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid endpoint identifier route variable", err}
	}

	endpoint, err := handler.EndpointService.Endpoint(portainer.EndpointID(endpointID))
	if err == portainer.ErrObjectNotFound {
		return &httperror.HandlerError{http.StatusNotFound, "Unable to find an endpoint with the specified identifier inside the database", err}
	} else if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to find an endpoint with the specified identifier inside the database", err}
	}

	if endpoint.Type == portainer.AzureEnvironment {
		return &httperror.HandlerError{http.StatusBadRequest, "Snapshots not supported for Azure endpoints", err}
	}

	snapshot, snapshotError := handler.Snapshotter.CreateSnapshot(endpoint)

	latestEndpointReference, err := handler.EndpointService.Endpoint(endpoint.ID)
	if latestEndpointReference == nil {
		return &httperror.HandlerError{http.StatusNotFound, "Unable to find an endpoint with the specified identifier inside the database", err}
	}

	latestEndpointReference.Status = portainer.EndpointStatusUp
	if snapshotError != nil {
		latestEndpointReference.Status = portainer.EndpointStatusDown
	}

	if snapshot != nil {
		latestEndpointReference.Snapshots = []portainer.Snapshot{*snapshot}
	}

	err = handler.EndpointService.UpdateEndpoint(latestEndpointReference.ID, latestEndpointReference)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to persist endpoint changes inside the database", err}
	}

	return response.Empty(w)
}
