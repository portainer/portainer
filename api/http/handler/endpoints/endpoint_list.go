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

	if start == 0 {
		start = 1
	}

	if limit == 0 {
		limit = 100
	}

	endpoints, err := handler.EndpointService.EndpointsPaginated(start, limit)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve endpoints from the database", err}
	}

	endpointGroups, err := handler.EndpointGroupService.EndpointGroups()
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve endpoint groups from the database", err}
	}

	endpointCount, err := handler.EndpointService.EndpointCount()
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve endpoints from the database", err}
	}

	securityContext, err := security.RetrieveRestrictedRequestContext(r)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve info from request context", err}
	}

	filteredEndpoints := security.FilterEndpoints(endpoints, endpointGroups, securityContext)

	if filter != "" {
		filter = strings.ToLower(filter)

		nfilteredendpoints := make([]portainer.Endpoint, 0)
		for _, endpoint := range filteredEndpoints {

			if strings.Contains(strings.ToLower(endpoint.Name), filter) {
				nfilteredendpoints = append(nfilteredendpoints, endpoint)
				continue
			} else if strings.Contains(strings.ToLower(endpoint.URL), filter) {
				nfilteredendpoints = append(nfilteredendpoints, endpoint)
				continue
			}

			if endpoint.Status == portainer.EndpointStatusUp && filter == "up" {
				nfilteredendpoints = append(nfilteredendpoints, endpoint)
				continue
			} else if endpoint.Status == portainer.EndpointStatusDown && filter == "down" {
				nfilteredendpoints = append(nfilteredendpoints, endpoint)
				continue
			}

			for _, tag := range endpoint.Tags {
				if strings.Contains(strings.ToLower(tag), filter) {
					nfilteredendpoints = append(nfilteredendpoints, endpoint)
					continue
				}
			}

			endpointGroup := getAssociatedGroup(&endpoint, endpointGroups)
			if strings.Contains(strings.ToLower(endpointGroup.Name), filter) {
				nfilteredendpoints = append(nfilteredendpoints, endpoint)
				continue
			}
		}

		filteredEndpoints = nfilteredendpoints
	}

	for idx := range filteredEndpoints {
		hideFields(&filteredEndpoints[idx])
	}

	w.Header().Set("X-Total-Count", strconv.Itoa(endpointCount))
	return response.JSON(w, filteredEndpoints)
}

func getAssociatedGroup(endpoint *portainer.Endpoint, groups []portainer.EndpointGroup) *portainer.EndpointGroup {
	for _, group := range groups {
		if group.ID == endpoint.GroupID {
			return &group
		}
	}
	return nil
}
