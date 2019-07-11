package endpoints

import (
	"net/http"
	"strconv"
	"strings"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/utils"

	"github.com/portainer/libhttp/request"

	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/response"
	"github.com/portainer/portainer/api/http/security"
)

// GET request on /api/endpoints
func (handler *Handler) endpointList(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	start, _ := request.RetrieveNumericQueryParameter(r, "start", true)
	limit, _ := request.RetrieveNumericQueryParameter(r, "limit", true)
	filter, _ := request.RetrieveQueryParameter(r, "filter", true)

	if start != 0 {
		start--
	}

	endpointGroups, err := handler.EndpointGroupService.EndpointGroups()
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve endpoint groups from the database", err}
	}

	endpoints, endpointCount, err := handler.getEndpointData(start, limit, filter, endpointGroups)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve endpoint data", err}
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

func (handler *Handler) getEndpointData(start, limit int, filter string, endpointGroups []portainer.EndpointGroup) ([]portainer.Endpoint, int, error) {
	if filter != "" {
		filter = strings.ToLower(filter)
		slicedFilter := utils.SliceFilter(filter)
		return handler.getFilteredEndpoints(start, limit, slicedFilter, endpointGroups)
	}

	return handler.getPaginatedEndpoints(start, limit)
}

func filterGroups(endpointGroups []portainer.EndpointGroup, filters utils.SlicedFilter) ([]portainer.EndpointGroup, portainer.EndpointGroupID) {
	matchingGroups := make([]portainer.EndpointGroup, 0)

	id, err := utils.ExtractGroupIdFromFilters(filters)
	filteredID := portainer.EndpointGroupID(id)
	if !err {
		return matchingGroups, filteredID
	}

	for _, group := range endpointGroups {
		if utils.StringContainsOneOf(strings.ToLower(group.Name), filters) {
			matchingGroups = append(matchingGroups, group)
			continue
		}

		for _, tag := range group.Tags {
			if utils.StringContainsOneOf(strings.ToLower(tag), filters) {
				matchingGroups = append(matchingGroups, group)
				break
			}
		}
	}

	return matchingGroups, filteredID
}

func (handler *Handler) getFilteredEndpoints(start, limit int, filters utils.SlicedFilter, endpointGroups []portainer.EndpointGroup) ([]portainer.Endpoint, int, error) {
	endpoints := make([]portainer.Endpoint, 0)

	matchingGroups, restrictedGroupID := filterGroups(endpointGroups, filters)

	e, err := handler.EndpointService.EndpointsFiltered(filters, matchingGroups, restrictedGroupID)
	if err != nil {
		return nil, 0, err
	}

	idx := 0
	for _, endpoint := range e {
		if limit == 0 || idx >= start && idx < start+limit {
			endpoints = append(endpoints, endpoint)
		}
		idx++
	}

	endpointCount := len(e)

	return endpoints, endpointCount, nil
}

func (handler *Handler) getPaginatedEndpoints(start, limit int) ([]portainer.Endpoint, int, error) {
	e, err := handler.EndpointService.EndpointsPaginated(start, limit)
	if err != nil {
		return nil, 0, err
	}

	ec, err := handler.EndpointService.EndpointCount()
	if err != nil {
		return nil, 0, err
	}

	return e, ec, nil
}
