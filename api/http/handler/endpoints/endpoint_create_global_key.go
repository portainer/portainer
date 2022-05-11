package endpoints

import (
	"errors"
	"net/http"

	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/response"
	portainer "github.com/portainer/portainer/api"
)

type endpointCreateGlobalKeyResponse struct {
	EndpointID portainer.EndpointID `json:"endpointID"`
}

// @id EndpointCreateGlobalKey
// @summary Create or retrieve the endpoint for an EdgeID
// @tags endpoints
// @success 200 {object} endpointCreateGlobalKeyResponse "Success"
// @failure 400 "Invalid request"
// @failure 500 "Server error"
// @router /endpoints/global-key [post]
func (handler *Handler) endpointCreateGlobalKey(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	edgeID := r.Header.Get(portainer.PortainerAgentEdgeIDHeader)
	if edgeID == "" {
		return httperror.BadRequest("Invalid Edge ID", errors.New("the Edge ID cannot be empty"))
	}

	// Search for existing endpoints for the given edgeID

	endpoints, err := handler.DataStore.Endpoint().Endpoints()
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve the endpoints from the database", err}
	}

	for _, endpoint := range endpoints {
		if endpoint.EdgeID == edgeID {
			return response.JSON(w, endpointCreateGlobalKeyResponse{endpoint.ID})
		}
	}

	return &httperror.HandlerError{http.StatusNotFound, "Unable to find the endpoint in the database", err}
}
