package endpoints

import (
	"net/http"

	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	"github.com/portainer/libhttp/response"
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/bolt/errors"
	"github.com/portainer/portainer/api/internal/snapshot"
)

// Snapshot endpoint
// @Summary Snapshots an endpoint
// @Description
// @Tags Endpoints
// @Accept json
// @Produce json
// @Param id path int true "endpoint id"
// @Success 204
// @Failure 400,404,500
// @Router /endpoints/{id}/snapshot [post]
func (handler *Handler) endpointSnapshot(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	endpointID, err := request.RetrieveNumericRouteVariableValue(r, "id")
	if err != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid endpoint identifier route variable", err}
	}

	endpoint, err := handler.DataStore.Endpoint().Endpoint(portainer.EndpointID(endpointID))
	if err == errors.ErrObjectNotFound {
		return &httperror.HandlerError{http.StatusNotFound, "Unable to find an endpoint with the specified identifier inside the database", err}
	} else if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to find an endpoint with the specified identifier inside the database", err}
	}

	if !snapshot.SupportDirectSnapshot(endpoint) {
		return &httperror.HandlerError{http.StatusBadRequest, "Snapshots not supported for this endpoint", err}
	}

	snapshotError := handler.SnapshotService.SnapshotEndpoint(endpoint)

	latestEndpointReference, err := handler.DataStore.Endpoint().Endpoint(endpoint.ID)
	if latestEndpointReference == nil {
		return &httperror.HandlerError{http.StatusNotFound, "Unable to find an endpoint with the specified identifier inside the database", err}
	}

	latestEndpointReference.Status = portainer.EndpointStatusUp
	if snapshotError != nil {
		latestEndpointReference.Status = portainer.EndpointStatusDown
	}

	latestEndpointReference.Snapshots = endpoint.Snapshots
	latestEndpointReference.Kubernetes.Snapshots = endpoint.Kubernetes.Snapshots

	err = handler.DataStore.Endpoint().UpdateEndpoint(latestEndpointReference.ID, latestEndpointReference)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to persist endpoint changes inside the database", err}
	}

	return response.Empty(w)
}
