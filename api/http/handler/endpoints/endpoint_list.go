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

// GET request on /api/endpoints
func (handler *Handler) endpointList(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	start, _ := request.RetrieveNumericQueryParameter(r, "start", false)
	limit, _ := request.RetrieveNumericQueryParameter(r, "limit", false)
	filter, _ := request.RetrieveQueryParameter(r, "filter", false)

	// TODO:
	// 1. filter pre-pagination // part of pagination
	// 2. endpoint count must match total filtered entries

	//var endpoints []portainer.Endpoint
	endpoints := make([]portainer.Endpoint, 0)
	var endpointCount int

	if filter != "" {
		e, err := handler.EndpointService.EndpointsFiltered(filter)
		if err != nil {
			return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve endpoints from the database", err}
		}

		if start != 0 {
			start--
		}

		idx := 0
		for _, endpoint := range e {
			if limit == 0 || idx >= start && idx < start+limit {
				endpoints = append(endpoints, endpoint)
			}
			idx++
		}

		//endpoints = e
		endpointCount = len(e)
	} else {
		e, err := handler.EndpointService.EndpointsPaginated(start, limit)
		if err != nil {
			return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve endpoints from the database", err}
		}

		ec, err := handler.EndpointService.EndpointCount()
		if err != nil {
			return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve endpoints from the database", err}
		}

		endpoints = e
		endpointCount = ec
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

	//if filter != "" {
	//	filteredEndpoints = filterEndpoints(filteredEndpoints, endpointGroups, filter)
	//}

	for idx := range filteredEndpoints {
		hideFields(&filteredEndpoints[idx])
	}

	w.Header().Set("X-Total-Count", strconv.Itoa(endpointCount))
	return response.JSON(w, filteredEndpoints)
}

func filterEndpoints(endpoints []portainer.Endpoint, endpointGroups []portainer.EndpointGroup, filter string) []portainer.Endpoint {
	filter = strings.ToLower(filter)

	filteredEndpoints := make([]portainer.Endpoint, 0)
	for _, endpoint := range endpoints {

		if strings.Contains(strings.ToLower(endpoint.Name), filter) {
			filteredEndpoints = append(filteredEndpoints, endpoint)
			continue
		} else if strings.Contains(strings.ToLower(endpoint.URL), filter) {
			filteredEndpoints = append(filteredEndpoints, endpoint)
			continue
		}

		if endpoint.Status == portainer.EndpointStatusUp && filter == "up" {
			filteredEndpoints = append(filteredEndpoints, endpoint)
			continue
		} else if endpoint.Status == portainer.EndpointStatusDown && filter == "down" {
			filteredEndpoints = append(filteredEndpoints, endpoint)
			continue
		}

		for _, tag := range endpoint.Tags {
			if strings.Contains(strings.ToLower(tag), filter) {
				filteredEndpoints = append(filteredEndpoints, endpoint)
				continue
			}
		}

		endpointGroup := getAssociatedGroup(&endpoint, endpointGroups)
		if strings.Contains(strings.ToLower(endpointGroup.Name), filter) {
			filteredEndpoints = append(filteredEndpoints, endpoint)
			continue
		}
	}

	return filteredEndpoints
}

func getAssociatedGroup(endpoint *portainer.Endpoint, groups []portainer.EndpointGroup) *portainer.EndpointGroup {
	for _, group := range groups {
		if group.ID == endpoint.GroupID {
			return &group
		}
	}
	return nil
}
