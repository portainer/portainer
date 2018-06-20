package endpointgroups

import (
	"net/http"

	httperror "github.com/portainer/portainer/http/error"
	"github.com/portainer/portainer/http/response"
	"github.com/portainer/portainer/http/security"
)

// GET request on /api/endpoint_groups
func (handler *Handler) endpointGroupList(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	endpointGroups, err := handler.EndpointGroupService.EndpointGroups()
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve endpoint groups from the database", err}
	}

	securityContext, err := security.RetrieveRestrictedRequestContext(r)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve info from request context", err}
	}

	endpointGroups = security.FilterEndpointGroups(endpointGroups, securityContext)
	return response.JSON(w, endpointGroups)
}
