package endpoints

import (
	"net/http"
	"strconv"
	"strings"

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
	endpointType, _ := request.RetrieveNumericQueryParameter(r, "type", true)

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
		tags, err := handler.TagsService.Tags()
		if err != nil {
			return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve tags from the database", err}
		}
		tagsMap := make(map[portainer.TagID]string)
		for _, tag := range tags {
			tagsMap[tag.ID] = tag.Name
		}
		filteredEndpoints = filterEndpointsBySearchCriteria(filteredEndpoints, endpointGroups, tagsMap, search)
	}

	if endpointType != 0 {
		filteredEndpoints = filterEndpointsByType(filteredEndpoints, portainer.EndpointType(endpointType))
	}

	if endpointType != 0 {
		filteredEndpoints = filterEndpointsByType(filteredEndpoints, portainer.EndpointType(endpointType))
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

func filterEndpointsBySearchCriteria(endpoints []portainer.Endpoint, endpointGroups []portainer.EndpointGroup, tagsMap map[portainer.TagID]string, searchCriteria string) []portainer.Endpoint {
	filteredEndpoints := make([]portainer.Endpoint, 0)

	for _, endpoint := range endpoints {
		endpointTags := convertTagIDsToTags(tagsMap, endpoint.TagIDs)
		if endpointMatchSearchCriteria(&endpoint, endpointTags, searchCriteria) {
			filteredEndpoints = append(filteredEndpoints, endpoint)
			continue
		}

		if endpointGroupMatchSearchCriteria(&endpoint, endpointGroups, tagsMap, searchCriteria) {
			filteredEndpoints = append(filteredEndpoints, endpoint)
		}
	}

	return filteredEndpoints
}

func endpointMatchSearchCriteria(endpoint *portainer.Endpoint, tags []string, searchCriteria string) bool {
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
	for _, tag := range tags {
		if strings.Contains(strings.ToLower(tag), searchCriteria) {
			return true
		}
	}

	return false
}

func endpointGroupMatchSearchCriteria(endpoint *portainer.Endpoint, endpointGroups []portainer.EndpointGroup, tagsMap map[portainer.TagID]string, searchCriteria string) bool {
	for _, group := range endpointGroups {
		if group.ID == endpoint.GroupID {
			if strings.Contains(strings.ToLower(group.Name), searchCriteria) {
				return true
			}
			tags := convertTagIDsToTags(tagsMap, group.TagIDs)
			for _, tag := range tags {
				if strings.Contains(strings.ToLower(tag), searchCriteria) {
					return true
				}
			}
		}
	}

	return false
}

func filterEndpointsByType(endpoints []portainer.Endpoint, endpointType portainer.EndpointType) []portainer.Endpoint {
	filteredEndpoints := make([]portainer.Endpoint, 0)

	for _, endpoint := range endpoints {
		if endpoint.Type == endpointType {
			filteredEndpoints = append(filteredEndpoints, endpoint)
		}
	}
	return filteredEndpoints
}

func convertTagIDsToTags(tagsMap map[portainer.TagID]string, tagIDs []portainer.TagID) []string {
	tags := make([]string, 0)
	for _, tagID := range tagIDs {
		tags = append(tags, tagsMap[tagID])
	}
	return tags
}
