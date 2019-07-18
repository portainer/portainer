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

type endpointListOperationFilters struct {
	Search  string `json:"search"`
	GroupID int    `json:"groupId"`
}

// GET request on /api/endpoints?(filters=<filters>)&(start=<start>)&(limit=<limit>)
func (handler *Handler) endpointList(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	var filters endpointListOperationFilters
	err := request.RetrieveJSONQueryParameter(r, "filters", &filters, true)
	if err != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid query parameter: filters", err}
	}

	start, _ := request.RetrieveNumericQueryParameter(r, "start", true)
	if start != 0 {
		start--
	}

	limit, _ := request.RetrieveNumericQueryParameter(r, "limit", true)

	endpointGroups, err := handler.EndpointGroupService.EndpointGroups()
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve endpoint groups from the database", err}
	}

	endpoints, endpointCount, err := handler.getEndpointData(start, limit, &filters, endpointGroups)
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

func (handler *Handler) getEndpointData(start, limit int, filter *endpointListOperationFilters, endpointGroups []portainer.EndpointGroup) ([]portainer.Endpoint, int, error) {
	if filter != nil {
		filter.Search = strings.ToLower(filter.Search)
		return handler.getFilteredEndpoints(start, limit, filter, endpointGroups)
	}

	return handler.getPaginatedEndpoints(start, limit)
}

func filterGroups(endpointGroups []portainer.EndpointGroup, filters *endpointListOperationFilters) []portainer.EndpointGroup {
	matchingGroups := make([]portainer.EndpointGroup, 0)

	if filters.Search == "" && filters.GroupID == 0 {
		return endpointGroups
	}

	if filters.GroupID != 0 {
		for _, group := range endpointGroups {
			if group.ID == portainer.EndpointGroupID(filters.GroupID) {

				if filters.Search == "" {
					matchingGroups = append(matchingGroups, group)
				} else if filters.Search != "" {
					if strings.Contains(strings.ToLower(group.Name), filters.Search) {
						matchingGroups = append(matchingGroups, group)
					}

					for _, tag := range group.Tags {
						if strings.Contains(strings.ToLower(tag), filters.Search) {
							matchingGroups = append(matchingGroups, group)
							break
						}
					}
				}

				return matchingGroups
			}
		}
	}

	if filters.Search != "" {
		for _, group := range endpointGroups {

			if filters.Search != "" && strings.Contains(strings.ToLower(group.Name), filters.Search) {
				matchingGroups = append(matchingGroups, group)
				continue
			}

			for _, tag := range group.Tags {
				if filters.Search != "" && strings.Contains(strings.ToLower(tag), filters.Search) {
					matchingGroups = append(matchingGroups, group)
					continue
				}
			}
		}
	}

	return matchingGroups
}

func (handler *Handler) getFilteredEndpoints(start, limit int, filters *endpointListOperationFilters, endpointGroups []portainer.EndpointGroup) ([]portainer.Endpoint, int, error) {
	endpoints := make([]portainer.Endpoint, 0)

	matchingGroups := filterGroups(endpointGroups, filters)

	e, err := handler.EndpointService.EndpointsFiltered(filters.Search, matchingGroups)
	if err != nil {
		return nil, 0, err
	}

	for idx, endpoint := range e {
		if limit == 0 || idx >= start && idx < start+limit {
			endpoints = append(endpoints, endpoint)
		}
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
