package endpoints

import (
	"net/http"
	"strconv"

	"github.com/portainer/libhttp/request"

	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/response"
	"github.com/portainer/portainer/api/http/security"
)

// GET request on /api/endpoints
func (handler *Handler) endpointList(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	lastID, _ := request.RetrieveNumericQueryParameter(r, "last_id", false)
	limit, _ := request.RetrieveNumericQueryParameter(r, "limit", false)
	//filter, _ := request.RetrieveQueryParameter(r, "filter", false)

	if lastID == 0 {
		lastID = 1
	}

	if limit == 0 {
		limit = 100
	}

	endpoints, err := handler.EndpointService.EndpointsPaginated(lastID, limit)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve endpoints from the database", err}
	}

	endpointCount, err := handler.EndpointService.EndpointCount()
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve endpoints from the database", err}
	}

	endpointGroups, err := handler.EndpointGroupService.EndpointGroups()
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve endpoint groups from the database", err}
	}

	securityContext, err := security.RetrieveRestrictedRequestContext(r)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve info from request context", err}
	}

	filteredEndpoints := security.FilterEndpoints(endpoints, endpointGroups, securityContext)

	for idx := range filteredEndpoints {
		hideFields(&filteredEndpoints[idx])
	}

	w.Header().Set("X-Total-Count", strconv.Itoa(endpointCount))
	return response.JSON(w, filteredEndpoints)
}
