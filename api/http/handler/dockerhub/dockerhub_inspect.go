package dockerhub

import (
	"net/http"

	httperror "github.com/portainer/portainer/http/error"
	"github.com/portainer/portainer/http/response"
)

// GET request on /api/dockerhub
func (handler *Handler) dockerhubInspect(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	dockerhub, err := handler.DockerHubService.DockerHub()
	if err != nil {
		return &httperror.HandlerError{err, "Unable to retrieve DockerHub details from the database", http.StatusInternalServerError}
	}

	// TODO: create a function with a generic name
	// that can be used to hide fields.
	// Example: filterResponse, filterForResponse, updateForResponse...
	dockerhub.Password = ""

	return response.WriteJSONResponse(w, dockerhub)
}
