package endpoints

import (
	"fmt"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/pkg/errors"
	"github.com/portainer/libhttp/request"
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/internal/endpointutils"
	"golang.org/x/exp/slices"
)

type EnvironmentsQuery struct {
	search              string
	types               []portainer.EndpointType
	tagIds              []portainer.TagID
	endpointIds         []portainer.EndpointID
	tagsPartialMatch    bool
	groupIds            []portainer.EndpointGroupID
	status              []portainer.EndpointStatus
	edgeDevice          *bool
	edgeDeviceUntrusted bool
	excludeSnapshots    bool
	name                string
	agentVersions       []string
}

func parseQuery(r *http.Request) (EnvironmentsQuery, error) {
	search, _ := request.RetrieveQueryParameter(r, "search", true)
	if search != "" {
		search = strings.ToLower(search)
	}

	status, err := getNumberArrayQueryParameter[portainer.EndpointStatus](r, "status")
	if err != nil {
		return EnvironmentsQuery{}, err
	}

	groupIDs, err := getNumberArrayQueryParameter[portainer.EndpointGroupID](r, "groupIds")
	if err != nil {
		return EnvironmentsQuery{}, err
	}

	endpointTypes, err := getNumberArrayQueryParameter[portainer.EndpointType](r, "types")
	if err != nil {
		return EnvironmentsQuery{}, err
	}

	tagIDs, err := getNumberArrayQueryParameter[portainer.TagID](r, "tagIds")
	if err != nil {
		return EnvironmentsQuery{}, err
	}

	tagsPartialMatch, _ := request.RetrieveBooleanQueryParameter(r, "tagsPartialMatch", true)

	endpointIDs, err := getNumberArrayQueryParameter[portainer.EndpointID](r, "endpointIds")
	if err != nil {
		return EnvironmentsQuery{}, err
	}

	agentVersions := getArrayQueryParameter(r, "agentVersions")

	name, _ := request.RetrieveQueryParameter(r, "name", true)

	edgeDeviceParam, _ := request.RetrieveQueryParameter(r, "edgeDevice", true)

	var edgeDevice *bool
	if edgeDeviceParam != "" {
		edgeDevice = BoolAddr(edgeDeviceParam == "true")
	}

	edgeDeviceUntrusted, _ := request.RetrieveBooleanQueryParameter(r, "edgeDeviceUntrusted", true)

	excludeSnapshots, _ := request.RetrieveBooleanQueryParameter(r, "excludeSnapshots", true)

	return EnvironmentsQuery{
		search:              search,
		types:               endpointTypes,
		tagIds:              tagIDs,
		endpointIds:         endpointIDs,
		tagsPartialMatch:    tagsPartialMatch,
		groupIds:            groupIDs,
		status:              status,
		edgeDevice:          edgeDevice,
		edgeDeviceUntrusted: edgeDeviceUntrusted,
		excludeSnapshots:    excludeSnapshots,
		name:                name,
		agentVersions:       agentVersions,
	}, nil
}

func (handler *Handler) filterEndpointsByQuery(filteredEndpoints []portainer.Endpoint, query EnvironmentsQuery, groups []portainer.EndpointGroup, settings *portainer.Settings) ([]portainer.Endpoint, int, error) {
	totalAvailableEndpoints := len(filteredEndpoints)

	if len(query.endpointIds) > 0 {
		filteredEndpoints = filteredEndpointsByIds(filteredEndpoints, query.endpointIds)
	}

	if len(query.groupIds) > 0 {
		filteredEndpoints = filterEndpointsByGroupIDs(filteredEndpoints, query.groupIds)
	}

	if query.name != "" {
		filteredEndpoints = filterEndpointsByName(filteredEndpoints, query.name)
	}

	if query.edgeDevice != nil {
		filteredEndpoints = filterEndpointsByEdgeDevice(filteredEndpoints, *query.edgeDevice, query.edgeDeviceUntrusted)
	} else {
		// If the edgeDevice parameter is not set, we need to filter out the untrusted edge devices
		filteredEndpoints = filter(filteredEndpoints, func(endpoint portainer.Endpoint) bool {
			return !endpoint.IsEdgeDevice || endpoint.UserTrusted
		})
	}

	if len(query.status) > 0 {
		filteredEndpoints = filterEndpointsByStatuses(filteredEndpoints, query.status, settings)
	}

	if query.search != "" {
		tags, err := handler.DataStore.Tag().Tags()
		if err != nil {
			return nil, 0, errors.WithMessage(err, "Unable to retrieve tags from the database")
		}

		tagsMap := make(map[portainer.TagID]string)
		for _, tag := range tags {
			tagsMap[tag.ID] = tag.Name
		}

		filteredEndpoints = filterEndpointsBySearchCriteria(filteredEndpoints, groups, tagsMap, query.search)
	}

	if len(query.types) > 0 {
		filteredEndpoints = filterEndpointsByTypes(filteredEndpoints, query.types)
	}

	if len(query.tagIds) > 0 {
		filteredEndpoints = filteredEndpointsByTags(filteredEndpoints, query.tagIds, groups, query.tagsPartialMatch)
	}

	if len(query.agentVersions) > 0 {
		filteredEndpoints = filter(filteredEndpoints, func(endpoint portainer.Endpoint) bool {
			return !endpointutils.IsAgentEndpoint(&endpoint) || contains(query.agentVersions, endpoint.Agent.Version)
		})
	}

	return filteredEndpoints, totalAvailableEndpoints, nil
}

func filterEndpointsByGroupIDs(endpoints []portainer.Endpoint, endpointGroupIDs []portainer.EndpointGroupID) []portainer.Endpoint {
	filteredEndpoints := make([]portainer.Endpoint, 0)

	for _, endpoint := range endpoints {
		if slices.Contains(endpointGroupIDs, endpoint.GroupID) {
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

func filterEndpointsByStatuses(endpoints []portainer.Endpoint, statuses []portainer.EndpointStatus, settings *portainer.Settings) []portainer.Endpoint {
	filteredEndpoints := make([]portainer.Endpoint, 0)

	for _, endpoint := range endpoints {
		status := endpoint.Status
		if endpointutils.IsEdgeEndpoint(&endpoint) {
			isCheckValid := false
			edgeCheckinInterval := endpoint.EdgeCheckinInterval
			if endpoint.EdgeCheckinInterval == 0 {
				edgeCheckinInterval = settings.EdgeAgentCheckinInterval
			}

			if edgeCheckinInterval != 0 && endpoint.LastCheckInDate != 0 {
				isCheckValid = time.Now().Unix()-endpoint.LastCheckInDate <= int64(edgeCheckinInterval*EdgeDeviceIntervalMultiplier+EdgeDeviceIntervalAdd)
			}

			status = portainer.EndpointStatusDown // Offline
			if isCheckValid {
				status = portainer.EndpointStatusUp // Online
			}
		}

		if slices.Contains(statuses, status) {
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

func filterEndpointsByTypes(endpoints []portainer.Endpoint, endpointTypes []portainer.EndpointType) []portainer.Endpoint {
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

func filterEndpointsByEdgeDevice(endpoints []portainer.Endpoint, edgeDevice bool, untrusted bool) []portainer.Endpoint {
	filteredEndpoints := make([]portainer.Endpoint, 0)

	for _, endpoint := range endpoints {
		if shouldReturnEdgeDevice(endpoint, edgeDevice, untrusted) {
			filteredEndpoints = append(filteredEndpoints, endpoint)
		}
	}
	return filteredEndpoints
}

func shouldReturnEdgeDevice(endpoint portainer.Endpoint, edgeDeviceParam bool, untrustedParam bool) bool {
	if !endpointutils.IsEdgeEndpoint(&endpoint) {
		return true
	}

	if !edgeDeviceParam {
		return !endpoint.IsEdgeDevice
	}

	return endpoint.IsEdgeDevice && endpoint.UserTrusted == !untrustedParam
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

func filterEndpointsByName(endpoints []portainer.Endpoint, name string) []portainer.Endpoint {
	if name == "" {
		return endpoints
	}

	filteredEndpoints := make([]portainer.Endpoint, 0)

	for _, endpoint := range endpoints {
		if endpoint.Name == name {
			filteredEndpoints = append(filteredEndpoints, endpoint)
		}
	}
	return filteredEndpoints
}

func filter(endpoints []portainer.Endpoint, predicate func(endpoint portainer.Endpoint) bool) []portainer.Endpoint {
	filteredEndpoints := make([]portainer.Endpoint, 0)

	for _, endpoint := range endpoints {
		if predicate(endpoint) {
			filteredEndpoints = append(filteredEndpoints, endpoint)
		}
	}
	return filteredEndpoints
}

func getArrayQueryParameter(r *http.Request, parameter string) []string {
	list, exists := r.Form[fmt.Sprintf("%s[]", parameter)]
	if !exists {
		list = []string{}
	}

	return list
}

func getNumberArrayQueryParameter[T ~int](r *http.Request, parameter string) ([]T, error) {
	list := getArrayQueryParameter(r, parameter)
	if list == nil {
		return []T{}, nil
	}

	var result []T
	for _, item := range list {
		number, err := strconv.Atoi(item)
		if err != nil {
			return nil, errors.Wrapf(err, "Unable to parse parameter %s", parameter)

		}

		result = append(result, T(number))
	}

	return result, nil
}

func contains(strings []string, param string) bool {
	for _, str := range strings {
		if str == param {
			return true
		}
	}

	return false
}
