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
	"github.com/portainer/portainer/api/dataservices"
	"github.com/portainer/portainer/api/http/handler/edgegroups"
	"github.com/portainer/portainer/api/internal/endpointutils"
	"github.com/portainer/portainer/api/internal/slices"
	"github.com/portainer/portainer/api/internal/unique"
)

type EnvironmentsQuery struct {
	search           string
	types            []portainer.EndpointType
	tagIds           []portainer.TagID
	endpointIds      []portainer.EndpointID
	tagsPartialMatch bool
	groupIds         []portainer.EndpointGroupID
	status           []portainer.EndpointStatus
	// if edgeAsync not nil, will filter edge endpoints based on this value
	edgeAsync                *bool
	edgeDeviceUntrusted      bool
	excludeSnapshots         bool
	name                     string
	agentVersions            []string
	edgeCheckInPassedSeconds int
	edgeStackId              portainer.EdgeStackID
	edgeStackStatus          *portainer.EdgeStackStatusType
	excludeIds               []portainer.EndpointID
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

	excludeIDs, err := getNumberArrayQueryParameter[portainer.EndpointID](r, "excludeIds")
	if err != nil {
		return EnvironmentsQuery{}, err
	}

	agentVersions := getArrayQueryParameter(r, "agentVersions")

	name, _ := request.RetrieveQueryParameter(r, "name", true)

	var edgeAsync *bool
	edgeAsyncParam, _ := request.RetrieveQueryParameter(r, "edgeAsync", true)
	if edgeAsyncParam != "" {
		edgeAsync = BoolAddr(edgeAsyncParam == "true")
	}

	edgeDeviceUntrusted, _ := request.RetrieveBooleanQueryParameter(r, "edgeDeviceUntrusted", true)

	excludeSnapshots, _ := request.RetrieveBooleanQueryParameter(r, "excludeSnapshots", true)

	edgeCheckInPassedSeconds, _ := request.RetrieveNumericQueryParameter(r, "edgeCheckInPassedSeconds", true)

	edgeStackId, _ := request.RetrieveNumericQueryParameter(r, "edgeStackId", true)

	edgeStackStatus, err := getEdgeStackStatusParam(r)
	if err != nil {
		return EnvironmentsQuery{}, err
	}

	return EnvironmentsQuery{
		search:                   search,
		types:                    endpointTypes,
		tagIds:                   tagIDs,
		endpointIds:              endpointIDs,
		excludeIds:               excludeIDs,
		tagsPartialMatch:         tagsPartialMatch,
		groupIds:                 groupIDs,
		status:                   status,
		edgeAsync:                edgeAsync,
		edgeDeviceUntrusted:      edgeDeviceUntrusted,
		excludeSnapshots:         excludeSnapshots,
		name:                     name,
		agentVersions:            agentVersions,
		edgeCheckInPassedSeconds: edgeCheckInPassedSeconds,
		edgeStackId:              portainer.EdgeStackID(edgeStackId),
		edgeStackStatus:          edgeStackStatus,
	}, nil
}

func (handler *Handler) filterEndpointsByQuery(filteredEndpoints []portainer.Endpoint, query EnvironmentsQuery, groups []portainer.EndpointGroup, settings *portainer.Settings) ([]portainer.Endpoint, int, error) {
	totalAvailableEndpoints := len(filteredEndpoints)

	if len(query.endpointIds) > 0 {
		filteredEndpoints = filteredEndpointsByIds(filteredEndpoints, query.endpointIds)
	}

	if len(query.excludeIds) > 0 {
		filteredEndpoints = filter(filteredEndpoints, func(endpoint portainer.Endpoint) bool {
			return !slices.Contains(query.excludeIds, endpoint.ID)
		})
	}

	if len(query.groupIds) > 0 {
		filteredEndpoints = filterEndpointsByGroupIDs(filteredEndpoints, query.groupIds)
	}

	if query.name != "" {
		filteredEndpoints = filterEndpointsByName(filteredEndpoints, query.name)
	}

	// filter async edge environments
	if query.edgeAsync != nil {
		filteredEndpoints = filter(filteredEndpoints, func(endpoint portainer.Endpoint) bool {
			if !endpointutils.IsEdgeEndpoint(&endpoint) {
				return true
			}

			return endpoint.Edge.AsyncMode == *query.edgeAsync
		})
	}

	// filter edge environments by trusted/untrusted
	filteredEndpoints = filter(filteredEndpoints, func(endpoint portainer.Endpoint) bool {
		if !endpointutils.IsEdgeEndpoint(&endpoint) {
			return true
		}

		return endpoint.UserTrusted == !query.edgeDeviceUntrusted
	})

	if query.edgeCheckInPassedSeconds > 0 {
		filteredEndpoints = filter(filteredEndpoints, func(endpoint portainer.Endpoint) bool {
			// ignore non-edge endpoints
			if !endpointutils.IsEdgeEndpoint(&endpoint) {
				return true
			}

			// filter out endpoints that have never checked in
			if endpoint.LastCheckInDate == 0 {
				return false
			}

			return time.Now().Unix()-endpoint.LastCheckInDate < int64(query.edgeCheckInPassedSeconds)
		})
	}

	if len(query.status) > 0 {
		filteredEndpoints = filterEndpointsByStatuses(filteredEndpoints, query.status, settings)
	}

	if query.search != "" {
		tags, err := handler.DataStore.Tag().ReadAll()
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
	if query.edgeStackId != 0 {
		f, err := filterEndpointsByEdgeStack(filteredEndpoints, query.edgeStackId, query.edgeStackStatus, handler.DataStore)
		if err != nil {
			return nil, 0, err
		}
		filteredEndpoints = f
	}

	return filteredEndpoints, totalAvailableEndpoints, nil
}

func endpointStatusInStackMatchesFilter(edgeStackStatus map[portainer.EndpointID]portainer.EdgeStackStatus, envId portainer.EndpointID, statusFilter portainer.EdgeStackStatusType) bool {
	status, ok := edgeStackStatus[envId]

	// consider that if the env has no status in the stack it is in Pending state
	if statusFilter == portainer.EdgeStackStatusPending {
		return !ok || len(status.Status) == 0
	}

	if !ok {
		return false
	}

	return slices.ContainsFunc(status.Status, func(s portainer.EdgeStackDeploymentStatus) bool {
		return s.Type == statusFilter
	})
}

func filterEndpointsByEdgeStack(endpoints []portainer.Endpoint, edgeStackId portainer.EdgeStackID, statusFilter *portainer.EdgeStackStatusType, datastore dataservices.DataStore) ([]portainer.Endpoint, error) {
	stack, err := datastore.EdgeStack().EdgeStack(edgeStackId)
	if err != nil {
		return nil, errors.WithMessage(err, "Unable to retrieve edge stack from the database")
	}

	envIds := make([]portainer.EndpointID, 0)
	for _, edgeGroupdId := range stack.EdgeGroups {
		edgeGroup, err := datastore.EdgeGroup().Read(edgeGroupdId)
		if err != nil {
			return nil, errors.WithMessage(err, "Unable to retrieve edge group from the database")
		}
		if edgeGroup.Dynamic {
			endpointIDs, err := edgegroups.GetEndpointsByTags(datastore, edgeGroup.TagIDs, edgeGroup.PartialMatch)
			if err != nil {
				return nil, errors.WithMessage(err, "Unable to retrieve environments and environment groups for Edge group")
			}
			edgeGroup.Endpoints = endpointIDs
		}
		envIds = append(envIds, edgeGroup.Endpoints...)
	}

	if statusFilter != nil {
		n := 0
		for _, envId := range envIds {
			if endpointStatusInStackMatchesFilter(stack.Status, envId, *statusFilter) {
				envIds[n] = envId
				n++
			}
		}
		envIds = envIds[:n]
	}

	uniqueIds := unique.Unique(envIds)
	filteredEndpoints := filteredEndpointsByIds(endpoints, uniqueIds)

	return filteredEndpoints, nil
}

func filterEndpointsByGroupIDs(endpoints []portainer.Endpoint, endpointGroupIDs []portainer.EndpointGroupID) []portainer.Endpoint {
	n := 0
	for _, endpoint := range endpoints {
		if slices.Contains(endpointGroupIDs, endpoint.GroupID) {
			endpoints[n] = endpoint
			n++
		}
	}

	return endpoints[:n]
}

func filterEndpointsBySearchCriteria(endpoints []portainer.Endpoint, endpointGroups []portainer.EndpointGroup, tagsMap map[portainer.TagID]string, searchCriteria string) []portainer.Endpoint {
	n := 0
	for _, endpoint := range endpoints {
		endpointTags := convertTagIDsToTags(tagsMap, endpoint.TagIDs)
		if endpointMatchSearchCriteria(&endpoint, endpointTags, searchCriteria) {
			endpoints[n] = endpoint
			n++

			continue
		}

		if endpointGroupMatchSearchCriteria(&endpoint, endpointGroups, tagsMap, searchCriteria) {
			endpoints[n] = endpoint
			n++
		}
	}

	return endpoints[:n]
}

func filterEndpointsByStatuses(endpoints []portainer.Endpoint, statuses []portainer.EndpointStatus, settings *portainer.Settings) []portainer.Endpoint {
	n := 0
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
			endpoints[n] = endpoint
			n++
		}
	}

	return endpoints[:n]
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
	typeSet := map[portainer.EndpointType]bool{}
	for _, endpointType := range endpointTypes {
		typeSet[portainer.EndpointType(endpointType)] = true
	}

	n := 0
	for _, endpoint := range endpoints {
		if typeSet[endpoint.Type] {
			endpoints[n] = endpoint
			n++
		}
	}

	return endpoints[:n]
}

func convertTagIDsToTags(tagsMap map[portainer.TagID]string, tagIDs []portainer.TagID) []string {
	tags := make([]string, 0, len(tagIDs))

	for _, tagID := range tagIDs {
		tags = append(tags, tagsMap[tagID])
	}

	return tags
}

func filteredEndpointsByTags(endpoints []portainer.Endpoint, tagIDs []portainer.TagID, endpointGroups []portainer.EndpointGroup, partialMatch bool) []portainer.Endpoint {
	n := 0
	for _, endpoint := range endpoints {
		endpointGroup := getEndpointGroup(endpoint.GroupID, endpointGroups)
		endpointMatched := false

		if partialMatch {
			endpointMatched = endpointPartialMatchTags(endpoint, endpointGroup, tagIDs)
		} else {
			endpointMatched = endpointFullMatchTags(endpoint, endpointGroup, tagIDs)
		}

		if endpointMatched {
			endpoints[n] = endpoint
			n++
		}
	}

	return endpoints[:n]
}

func endpointPartialMatchTags(endpoint portainer.Endpoint, endpointGroup portainer.EndpointGroup, tagIDs []portainer.TagID) bool {
	tagSet := make(map[portainer.TagID]bool, len(tagIDs))

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
	idsSet := make(map[portainer.EndpointID]bool, len(ids))
	for _, id := range ids {
		idsSet[id] = true
	}

	n := 0
	for _, endpoint := range endpoints {
		if idsSet[endpoint.ID] {
			endpoints[n] = endpoint
			n++
		}
	}

	return endpoints[:n]
}

func filterEndpointsByName(endpoints []portainer.Endpoint, name string) []portainer.Endpoint {
	if name == "" {
		return endpoints
	}

	n := 0
	for _, endpoint := range endpoints {
		if endpoint.Name == name {
			endpoints[n] = endpoint
			n++
		}
	}

	return endpoints[:n]
}

func filter(endpoints []portainer.Endpoint, predicate func(endpoint portainer.Endpoint) bool) []portainer.Endpoint {
	n := 0
	for _, endpoint := range endpoints {
		if predicate(endpoint) {
			endpoints[n] = endpoint
			n++
		}
	}

	return endpoints[:n]
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

func getEdgeStackStatusParam(r *http.Request) (*portainer.EdgeStackStatusType, error) {
	edgeStackStatusQuery, _ := request.RetrieveQueryParameter(r, "edgeStackStatus", true)
	if edgeStackStatusQuery == "" {
		return nil, nil
	}

	edgeStackStatusNumber, err := strconv.Atoi(edgeStackStatusQuery)
	edgeStackStatus := portainer.EdgeStackStatusType(edgeStackStatusNumber)
	if err != nil {
		return nil, fmt.Errorf("failed parsing edgeStackStatus: %w", err)
	}

	if !slices.Contains([]portainer.EdgeStackStatusType{
		portainer.EdgeStackStatusPending,
		portainer.EdgeStackStatusDeploymentReceived,
		portainer.EdgeStackStatusError,
		portainer.EdgeStackStatusAcknowledged,
		portainer.EdgeStackStatusRemoved,
		portainer.EdgeStackStatusRemoteUpdateSuccess,
		portainer.EdgeStackStatusImagesPulled,
		portainer.EdgeStackStatusRunning,
		portainer.EdgeStackStatusDeploying,
		portainer.EdgeStackStatusRemoving,
	}, edgeStackStatus) {
		return nil, errors.New("invalid edgeStackStatus parameter")
	}

	return &edgeStackStatus, nil
}
