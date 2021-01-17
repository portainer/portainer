package endpoints

import (
	"log"
	"net/http"

	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/response"
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/internal/snapshot"
)

// @summary Snapshot all endpoints
// @description
// @tags endpoints
// @security ApiKeyAuth
// @accept json
// @produce json
// @success 204
// @failure 500
// @router /endpoints/snapshot [post]
func (handler *Handler) endpointSnapshots(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	endpoints, err := handler.DataStore.Endpoint().Endpoints()
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve endpoints from the database", err}
	}

	for _, endpoint := range endpoints {
		if !snapshot.SupportDirectSnapshot(&endpoint) {
			continue
		}

		snapshotError := handler.SnapshotService.SnapshotEndpoint(&endpoint)

		latestEndpointReference, err := handler.DataStore.Endpoint().Endpoint(endpoint.ID)
		if latestEndpointReference == nil {
			log.Printf("background schedule error (endpoint snapshot). Endpoint not found inside the database anymore (endpoint=%s, URL=%s) (err=%s)\n", endpoint.Name, endpoint.URL, err)
			continue
		}

		endpoint.Status = portainer.EndpointStatusUp
		if snapshotError != nil {
			log.Printf("background schedule error (endpoint snapshot). Unable to create snapshot (endpoint=%s, URL=%s) (err=%s)\n", endpoint.Name, endpoint.URL, snapshotError)
			endpoint.Status = portainer.EndpointStatusDown
		}

		latestEndpointReference.Snapshots = endpoint.Snapshots
		latestEndpointReference.Kubernetes.Snapshots = endpoint.Kubernetes.Snapshots

		err = handler.DataStore.Endpoint().UpdateEndpoint(latestEndpointReference.ID, latestEndpointReference)
		if err != nil {
			return &httperror.HandlerError{http.StatusInternalServerError, "Unable to persist endpoint changes inside the database", err}
		}
	}

	return response.Empty(w)
}
