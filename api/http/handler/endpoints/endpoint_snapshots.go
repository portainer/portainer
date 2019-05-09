package endpoints

import (
	"log"
	"net/http"

	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/response"
	"github.com/portainer/portainer/api"
)

// POST request on /api/endpoints/snapshot
func (handler *Handler) endpointSnapshots(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	endpoints, err := handler.EndpointService.Endpoints()
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve endpoints from the database", err}
	}

	for _, endpoint := range endpoints {
		if endpoint.Type == portainer.AzureEnvironment {
			continue
		}

		snapshot, snapshotError := handler.Snapshotter.CreateSnapshot(&endpoint)

		latestEndpointReference, err := handler.EndpointService.Endpoint(endpoint.ID)
		if latestEndpointReference == nil {
			log.Printf("background schedule error (endpoint snapshot). Endpoint not found inside the database anymore (endpoint=%s, URL=%s) (err=%s)\n", endpoint.Name, endpoint.URL, err)
			continue
		}

		latestEndpointReference.Status = portainer.EndpointStatusUp
		if snapshotError != nil {
			log.Printf("background schedule error (endpoint snapshot). Unable to create snapshot (endpoint=%s, URL=%s) (err=%s)\n", endpoint.Name, endpoint.URL, snapshotError)
			latestEndpointReference.Status = portainer.EndpointStatusDown
		}

		if snapshot != nil {
			latestEndpointReference.Snapshots = []portainer.Snapshot{*snapshot}
		}

		err = handler.EndpointService.UpdateEndpoint(latestEndpointReference.ID, latestEndpointReference)
		if err != nil {
			return &httperror.HandlerError{http.StatusInternalServerError, "Unable to persist endpoint changes inside the database", err}
		}
	}

	return response.Empty(w)
}
