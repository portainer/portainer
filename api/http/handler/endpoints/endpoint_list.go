package endpoints

import (
	"net/http"
	"sort"
	"strconv"
	"strings"
	"time"

	"github.com/portainer/libhttp/request"

	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/response"
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/http/security"
	"github.com/portainer/portainer/api/internal/endpointutils"
)

const (
	EdgeDeviceFilterAll       = "all"
	EdgeDeviceFilterTrusted   = "trusted"
	EdgeDeviceFilterUntrusted = "untrusted"
)

// @id EndpointList
// @summary List environments(endpoints)
// @description List all environments(endpoints) based on the current user authorizations. Will
// @description return all environments(endpoints) if using an administrator account otherwise it will
// @description only return authorized environments(endpoints).
// @description **Access policy**: restricted
// @tags endpoints
// @security ApiKeyAuth
// @security jwt
// @produce json
// @param start query int false "Start searching from"
// @param search query string false "Search query"
// @param groupId query int false "List environments(endpoints) of this group"
// @param limit query int false "Limit results to this value"
// @param types query []int false "List environments(endpoints) of this type"
// @param tagIds query []int false "search environments(endpoints) with these tags (depends on tagsPartialMatch)"
// @param tagsPartialMatch query bool false "If true, will return environment(endpoint) which has one of tagIds, if false (or missing) will return only environments(endpoints) that has all the tags"
// @param endpointIds query []int false "will return only these environments(endpoints)"
// @param edgeDeviceFilter query string false "will return only these edge devices" Enum("all", "trusted", "untrusted")
// @success 200 {array} portainer.Endpoint "Endpoints"
// @failure 500 "Server error"
// @router /endpoints [get]
func (handler *Handler) endpointList(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	start, _ := request.RetrieveNumericQueryParameter(r, "start", true)
	if start != 0 {
		start--
	}

	search, _ := request.RetrieveQueryParameter(r, "search", true)
	if search != "" {
		search = strings.ToLower(search)
	}

	limit, _ := request.RetrieveNumericQueryParameter(r, "limit", true)
	sortField, _ := request.RetrieveQueryParameter(r, "sort", true)
	sortOrder, _ := request.RetrieveQueryParameter(r, "order", true)

	var endpointTypes []int
	request.RetrieveJSONQueryParameter(r, "types", &endpointTypes, true)

	var tagIDs []portainer.TagID
	request.RetrieveJSONQueryParameter(r, "tagIds", &tagIDs, true)

	tagsPartialMatch, _ := request.RetrieveBooleanQueryParameter(r, "tagsPartialMatch", true)

	var endpointIDs []portainer.EndpointID
	request.RetrieveJSONQueryParameter(r, "endpointIds", &endpointIDs, true)

	var statuses []int
	request.RetrieveJSONQueryParameter(r, "status", &statuses, true)

	var groupIDs []int
	request.RetrieveJSONQueryParameter(r, "groupIds", &groupIDs, true)

	endpointGroups, err := handler.DataStore.EndpointGroup().EndpointGroups()
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve environment groups from the database", err}
	}

	endpoints, err := handler.DataStore.Endpoint().Endpoints()
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve environments from the database", err}
	}

	settings, err := handler.DataStore.Settings().Settings()
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve settings from the database", err}
	}

	securityContext, err := security.RetrieveRestrictedRequestContext(r)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve info from request context", err}
	}

	filteredEndpoints := security.FilterEndpoints(endpoints, endpointGroups, securityContext)
	totalAvailableEndpoints := len(filteredEndpoints)

	if endpointIDs != nil {
		filteredEndpoints = filteredEndpointsByIds(filteredEndpoints, endpointIDs)
	}

	if len(groupIDs) > 0 {
		filteredEndpoints = filterEndpointsByGroupID(filteredEndpoints, groupIDs)
	}

	edgeDeviceFilter, _ := request.RetrieveQueryParameter(r, "edgeDeviceFilter", false)
	if edgeDeviceFilter != "" {
		filteredEndpoints = filterEndpointsByEdgeDevice(filteredEndpoints, edgeDeviceFilter)
	}

	if len(statuses) > 0 {
		filteredEndpoints = filterEndpointsByStatuses(filteredEndpoints, statuses)
	}

	if search != "" {
		tags, err := handler.DataStore.Tag().Tags()
		if err != nil {
			return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve tags from the database", err}
		}
		tagsMap := make(map[portainer.TagID]string)
		for _, tag := range tags {
			tagsMap[tag.ID] = tag.Name
		}
		filteredEndpoints = filterEndpointsBySearchCriteria(filteredEndpoints, endpointGroups, tagsMap, search)
	}

	if endpointTypes != nil {
		filteredEndpoints = filterEndpointsByTypes(filteredEndpoints, endpointTypes)
	}

	if tagIDs != nil {
		filteredEndpoints = filteredEndpointsByTags(filteredEndpoints, tagIDs, endpointGroups, tagsPartialMatch)
	}

	// Sort endpoints by field
	if sortField != "" {
		sortEndpointsByField(filteredEndpoints, endpointGroups, sortField, sortOrder)
	}

	filteredEndpointCount := len(filteredEndpoints)

	paginatedEndpoints := paginateEndpoints(filteredEndpoints, start, limit)

	for idx := range paginatedEndpoints {
		hideFields(&paginatedEndpoints[idx])
		paginatedEndpoints[idx].ComposeSyntaxMaxVersion = handler.ComposeStackManager.ComposeSyntaxMaxVersion()
		if paginatedEndpoints[idx].EdgeCheckinInterval == 0 {
			paginatedEndpoints[idx].EdgeCheckinInterval = settings.EdgeAgentCheckinInterval
		}
		paginatedEndpoints[idx].QueryDate = time.Now().Unix()
	}

	w.Header().Set("X-Total-Count", strconv.Itoa(filteredEndpointCount))
	w.Header().Set("X-Total-Available", strconv.Itoa(totalAvailableEndpoints))
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

func filterEndpointsByGroupID(endpoints []portainer.Endpoint, endpointGroupIDs []int) []portainer.Endpoint {
	filteredEndpoints := make([]portainer.Endpoint, 0)

	for _, endpoint := range endpoints {
		if containsInIntSlice(endpointGroupIDs, int(endpoint.GroupID)) {
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

func containsInIntSlice(s []int, e int) bool {
	for _, a := range s {
		if a == e {
			return true
		}
	}
	return false
}

func filterEndpointsByStatuses(endpoints []portainer.Endpoint, statuses []int) []portainer.Endpoint {
	filteredEndpoints := make([]portainer.Endpoint, 0)

	for _, endpoint := range endpoints {
		status := endpoint.Status
		if endpointutils.IsEdgeEndpoint(&endpoint) {
			isCheckValid := false
			if endpoint.EdgeCheckinInterval != 0 && endpoint.LastCheckInDate != 0 {
				isCheckValid = time.Now().Unix()-endpoint.LastCheckInDate <= int64(endpoint.EdgeCheckinInterval*2+20)
			}
			status = portainer.EndpointStatusDown // Offline
			if isCheckValid {
				status = portainer.EndpointStatusUp // Online
			}
		}

		if containsInIntSlice(statuses, int(status)) {
			filteredEndpoints = append(filteredEndpoints, endpoint)
			continue
		}
	}

	return filteredEndpoints
}

func sortEndpointsByField(endpoints []portainer.Endpoint, endpointGroups []portainer.EndpointGroup, sortField, sortOrder string) {
	if sortField == "Name" {
		if sortOrder == "asc" {
			sort.Slice(endpoints, func(i, j int) bool {
				// Case insensitive sort
				return strings.ToLower(endpoints[i].Name) < strings.ToLower(endpoints[j].Name)
			})
		} else {
			sort.Slice(endpoints, func(i, j int) bool {
				return strings.ToLower(endpoints[i].Name) > strings.ToLower(endpoints[j].Name)
			})
		}
	}

	if sortField == "Group" {
		if sortOrder == "asc" {
			sort.Slice(endpoints, func(i, j int) bool {
				groupOne := getEndpointGroup(endpoints[i].GroupID, endpointGroups)
				groupTwo := getEndpointGroup(endpoints[j].GroupID, endpointGroups)
				return strings.ToLower(groupOne.Name) < strings.ToLower(groupTwo.Name)
			})
		} else {
			sort.Slice(endpoints, func(i, j int) bool {
				groupOne := getEndpointGroup(endpoints[i].GroupID, endpointGroups)
				groupTwo := getEndpointGroup(endpoints[j].GroupID, endpointGroups)
				return strings.ToLower(groupOne.Name) > strings.ToLower(groupTwo.Name)
			})
		}
	}

	if sortField == "Status" {
		if sortOrder == "asc" {
			sort.Slice(endpoints, func(i, j int) bool {
				return endpoints[i].Status < endpoints[j].Status
			})
		} else {
			sort.Slice(endpoints, func(i, j int) bool {
				return endpoints[i].Status > endpoints[j].Status
			})
		}
	}
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

func filterEndpointsByTypes(endpoints []portainer.Endpoint, endpointTypes []int) []portainer.Endpoint {
	filteredEndpoints := make([]portainer.Endpoint, 0)

	typeSet := map[portainer.EndpointType]bool{}
	for _, endpointType := range endpointTypes {
		typeSet[portainer.EndpointType(endpointType)] = true
	}

	for _, endpoint := range endpoints {
		if typeSet[endpoint.Type] {
			filteredEndpoints = append(filteredEndpoints, endpoint)
		}
	}
	return filteredEndpoints
}

func filterEndpointsByEdgeDevice(endpoints []portainer.Endpoint, edgeDeviceFilter string) []portainer.Endpoint {
	filteredEndpoints := make([]portainer.Endpoint, 0)

	if edgeDeviceFilter != EdgeDeviceFilterAll && edgeDeviceFilter != EdgeDeviceFilterTrusted && edgeDeviceFilter != EdgeDeviceFilterUntrusted {
		return endpoints
	}

	for _, endpoint := range endpoints {
		if shouldReturnEdgeDevice(endpoint, edgeDeviceFilter) {
			filteredEndpoints = append(filteredEndpoints, endpoint)
		}
	}
	return filteredEndpoints
}

func shouldReturnEdgeDevice(endpoint portainer.Endpoint, edgeDeviceFilter string) bool {
	if !endpoint.IsEdgeDevice {
		return false
	}

	switch edgeDeviceFilter {
	case EdgeDeviceFilterAll:
		return true
	case EdgeDeviceFilterTrusted:
		return endpoint.UserTrusted
	case EdgeDeviceFilterUntrusted:
		return !endpoint.UserTrusted
	}

	return false
}

func convertTagIDsToTags(tagsMap map[portainer.TagID]string, tagIDs []portainer.TagID) []string {
	tags := make([]string, 0)
	for _, tagID := range tagIDs {
		tags = append(tags, tagsMap[tagID])
	}
	return tags
}

func filteredEndpointsByTags(endpoints []portainer.Endpoint, tagIDs []portainer.TagID, endpointGroups []portainer.EndpointGroup, partialMatch bool) []portainer.Endpoint {
	filteredEndpoints := make([]portainer.Endpoint, 0)

	for _, endpoint := range endpoints {
		endpointGroup := getEndpointGroup(endpoint.GroupID, endpointGroups)
		endpointMatched := false
		if partialMatch {
			endpointMatched = endpointPartialMatchTags(endpoint, endpointGroup, tagIDs)
		} else {
			endpointMatched = endpointFullMatchTags(endpoint, endpointGroup, tagIDs)
		}

		if endpointMatched {
			filteredEndpoints = append(filteredEndpoints, endpoint)
		}
	}
	return filteredEndpoints
}

func getEndpointGroup(groupID portainer.EndpointGroupID, groups []portainer.EndpointGroup) portainer.EndpointGroup {
	var endpointGroup portainer.EndpointGroup
	for _, group := range groups {
		if group.ID == groupID {
			endpointGroup = group
			break
		}
	}
	return endpointGroup
}

func endpointPartialMatchTags(endpoint portainer.Endpoint, endpointGroup portainer.EndpointGroup, tagIDs []portainer.TagID) bool {
	tagSet := make(map[portainer.TagID]bool)
	for _, tagID := range tagIDs {
		tagSet[tagID] = true
	}
	for _, tagID := range endpoint.TagIDs {
		if tagSet[tagID] {
			return true
		}
	}
	for _, tagID := range endpointGroup.TagIDs {
		if tagSet[tagID] {
			return true
		}
	}
	return false
}

func endpointFullMatchTags(endpoint portainer.Endpoint, endpointGroup portainer.EndpointGroup, tagIDs []portainer.TagID) bool {
	missingTags := make(map[portainer.TagID]bool)
	for _, tagID := range tagIDs {
		missingTags[tagID] = true
	}
	for _, tagID := range endpoint.TagIDs {
		if missingTags[tagID] {
			delete(missingTags, tagID)
		}
	}
	for _, tagID := range endpointGroup.TagIDs {
		if missingTags[tagID] {
			delete(missingTags, tagID)
		}
	}
	return len(missingTags) == 0
}

func filteredEndpointsByIds(endpoints []portainer.Endpoint, ids []portainer.EndpointID) []portainer.Endpoint {
	filteredEndpoints := make([]portainer.Endpoint, 0)

	idsSet := make(map[portainer.EndpointID]bool)
	for _, id := range ids {
		idsSet[id] = true
	}

	for _, endpoint := range endpoints {
		if idsSet[endpoint.ID] {
			filteredEndpoints = append(filteredEndpoints, endpoint)
		}
	}

	return filteredEndpoints

}
