package endpointedge

import (
	"net/http"

	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/response"
	"github.com/portainer/portainer/api/http/middlewares"
	"github.com/portainer/portainer/api/internal/endpointutils"
)

// endpointHide
// @summary Hide an untrusted edge device from waiting room
// @description **Access policy**: admin
// @tags edge, endpoints
// @accept json
// @produce json
// @param id path string true "Environment Id"
// @success 204
// @failure 500
// @failure 400
// @router /endpoints/{id}/edge/hide [post]
func (handler *Handler) endpointHide(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	endpoint, err := middlewares.FetchEndpoint(r)
	if err != nil {
		return httperror.BadRequest("Unable to find an environment on request context", err)
	}

	if !endpointutils.IsEdgeEndpoint(endpoint) {
		return httperror.BadRequest("Environment is not an edge environment", nil)
	}

	if endpoint.UserTrusted {
		return httperror.BadRequest("Environment is already trusted", nil)
	}

	endpoint.Edge.Hidden = true

	err = handler.DataStore.Endpoint().UpdateEndpoint(endpoint.ID, endpoint)
	if err != nil {
		return httperror.InternalServerError("Unable to persist environment changes inside the database", err)
	}

	return response.Empty(w)
}
