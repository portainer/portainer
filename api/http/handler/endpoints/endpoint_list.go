package endpoints

import (
	"net/http"
	"strconv"
	"strings"

	portainer "github.com/portainer/portainer/api"

	"github.com/portainer/libhttp/request"

	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/response"
	"github.com/portainer/portainer/api/http/security"
)

// GET request on /api/endpoints?(start=<start>)&(limit=<limit>)&(search=<search>)&(groupId=<groupId)
func (handler *Handler) endpointList(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	start, _ := request.RetrieveNumericQueryParameter(r, "start", true)
	if start != 0 {
		start--
	}

	search, _ := request.RetrieveQueryParameter(r, "search", true)
	if search != "" {
		search = strings.ToLower(search)
	}

	groupID, _ := request.RetrieveNumericQueryParameter(r, "groupId", true)
	limit, _ := request.RetrieveNumericQueryParameter(r, "limit", true)

	endpointGroups, err := handler.EndpointGroupService.EndpointGroups()
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve endpoint groups from the database", err}
	}

	endpoints, err := handler.EndpointService.Endpoints()
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve endpoints from the database", err}
	}

	securityContext, err := security.RetrieveRestrictedRequestContext(r)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve info from request context", err}
	}

	filteredEndpoints := security.FilterEndpoints(endpoints, endpointGroups, securityContext)

	if groupID != 0 {
		filteredEndpoints = filterEndpointsByGroupID(filteredEndpoints, portainer.EndpointGroupID(groupID))
	}

	if search != "" {
		filteredEndpoints = filterEndpointsBySearchCriteria(filteredEndpoints, endpointGroups, search)
	}

	filteredEndpointCount := len(filteredEndpoints)

	paginatedEndpoints := paginateEndpoints(filteredEndpoints, start, limit)

	for idx := range paginatedEndpoints {
		hideFields(&paginatedEndpoints[idx])
	}

	w.Header().Set("X-Total-Count", strconv.Itoa(filteredEndpointCount))
	return response.JSON(w, paginatedEndpoints)
}

func paginateEndpoints(endpoints []portainer.Endpoint, start, limit int) []portainer.Endpoint {
	if limit == 0 {
		return endpoints
	}

	endpointCount := len(endpoints)

	if start > endpointCount {
		start = endpointCount
	}

	end := start + limit
	if end > endpointCount {
		end = endpointCount
	}

	return endpoints[start:end]
}

func filterEndpointsByGroupID(endpoints []portainer.Endpoint, endpointGroupID portainer.EndpointGroupID) []portainer.Endpoint {
	filteredEndpoints := make([]portainer.Endpoint, 0)

	for _, endpoint := range endpoints {
		if endpoint.GroupID == endpointGroupID {
			filteredEndpoints = append(filteredEndpoints, endpoint)
		}
	}

	return filteredEndpoints
}

func filterEndpointsBySearchCriteria(endpoints []portainer.Endpoint, endpointGroups []portainer.EndpointGroup, searchCriteria string) []portainer.Endpoint {
	filteredEndpoints := make([]portainer.Endpoint, 0)

	for _, endpoint := range endpoints {

		if endpointMatchSearchCriteria(&endpoint, searchCriteria) {
			filteredEndpoints = append(filteredEndpoints, endpoint)
			continue
		}

		if endpointGroupMatchSearchCriteria(&endpoint, endpointGroups, searchCriteria) {
			filteredEndpoints = append(filteredEndpoints, endpoint)
		}
	}

	return filteredEndpoints
}

func endpointMatchSearchCriteria(endpoint *portainer.Endpoint, searchCriteria string) bool {
	if strings.Contains(strings.ToLower(endpoint.Name), searchCriteria) {
		return true
	}

	if strings.Contains(strings.ToLower(endpoint.URL), searchCriteria) {
		return true
	}

	if endpoint.Status == portainer.EndpointStatusUp && searchCriteria == "up" {
		return true
	} else if endpoint.Status == portainer.EndpointStatusDown && searchCriteria == "down" {
		return true
	}

	for _, tag := range endpoint.Tags {
		if strings.Contains(strings.ToLower(tag), searchCriteria) {
			return true
		}
	}

	return false
}

func endpointGroupMatchSearchCriteria(endpoint *portainer.Endpoint, endpointGroups []portainer.EndpointGroup, searchCriteria string) bool {
	for _, group := range endpointGroups {
		if group.ID == endpoint.GroupID {
			if strings.Contains(strings.ToLower(group.Name), searchCriteria) {
				return true
			}

			for _, tag := range group.Tags {
				if strings.Contains(strings.ToLower(tag), searchCriteria) {
					return true
				}
			}
		}
	}

	return false
}
