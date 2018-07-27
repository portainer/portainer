package endpoints

import (
	"log"
	"net/http"

	"github.com/portainer/portainer"
	httperror "github.com/portainer/portainer/http/error"
	"github.com/portainer/portainer/http/response"
)

// POST request on /api/endpoints/snapshot
func (handler *Handler) endpointSnapshot(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	endpoints, err := handler.EndpointService.Endpoints()
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve endpoints from the database", err}
	}

	for _, endpoint := range endpoints {
		if endpoint.Type == portainer.AzureEnvironment {
			continue
		}

		snapshot, err := handler.Snapshotter.CreateSnapshot(&endpoint)
		endpoint.Status = portainer.EndpointStatusUp
		if err != nil {
			log.Printf("http error: endpoint snapshot error (endpoint=%s, URL=%s) (err=%s)\n", endpoint.Name, endpoint.URL, err)
			endpoint.Status = portainer.EndpointStatusDown
		}

		if snapshot != nil {
			endpoint.Snapshots = []portainer.Snapshot{*snapshot}
		}

		err = handler.EndpointService.UpdateEndpoint(endpoint.ID, &endpoint)
		if err != nil {
			return &httperror.HandlerError{http.StatusInternalServerError, "Unable to persist endpoint changes inside the database", err}
		}
	}

	return response.Empty(w)
}
