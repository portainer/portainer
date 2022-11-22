package endpoints

import (
	"net/http"
	"sort"
	"strconv"
	"time"

	"github.com/portainer/libhttp/request"
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/http/security"

	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/response"
)

const (
	EdgeDeviceIntervalMultiplier = 2
	EdgeDeviceIntervalAdd        = 20
)

// @id EndpointList
// @summary List environments(endpoints)
// @description List all environments(endpoints) based on the current user authorizations. Will
// @description return all environments(endpoints) if using an administrator or team leader account otherwise it will
// @description only return authorized environments(endpoints).
// @description **Access policy**: restricted
// @tags endpoints
// @security ApiKeyAuth
// @security jwt
// @produce json
// @param start query int false "Start searching from"
// @param limit query int false "Limit results to this value"
// @param sort query int false "Sort results by this value"
// @param order query int false "Order sorted results by desc/asc" Enum("asc", "desc")
// @param search query string false "Search query"
// @param groupIds query []int false "List environments(endpoints) of these groups"
// @param status query []int false "List environments(endpoints) by this status"
// @param types query []int false "List environments(endpoints) of this type"
// @param tagIds query []int false "search environments(endpoints) with these tags (depends on tagsPartialMatch)"
// @param tagsPartialMatch query bool false "If true, will return environment(endpoint) which has one of tagIds, if false (or missing) will return only environments(endpoints) that has all the tags"
// @param endpointIds query []int false "will return only these environments(endpoints)"
// @param provisioned query bool false "If true, will return environment(endpoint) that were provisioned"
// @param agentVersions query []string false "will return only environments with on of these agent versions"
// @param edgeDevice query bool false "if exists true show only edge devices, false show only regular edge endpoints. if missing, will show both types (relevant only for edge endpoints)"
// @param edgeDeviceUntrusted query bool false "if true, show only untrusted endpoints, if false show only trusted (relevant only for edge devices, and if edgeDevice is true)"
// @param name query string false "will return only environments(endpoints) with this name"
// @success 200 {array} portainer.Endpoint "Endpoints"
// @failure 500 "Server error"
// @router /endpoints [get]
func (handler *Handler) endpointList(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	start, _ := request.RetrieveNumericQueryParameter(r, "start", true)
	if start != 0 {
		start--
	}

	limit, _ := request.RetrieveNumericQueryParameter(r, "limit", true)
	sortField, _ := request.RetrieveQueryParameter(r, "sort", true)
	sortOrder, _ := request.RetrieveQueryParameter(r, "order", true)

	endpointGroups, err := handler.DataStore.EndpointGroup().EndpointGroups()
	if err != nil {
		return httperror.InternalServerError("Unable to retrieve environment groups from the database", err)
	}

	endpoints, err := handler.DataStore.Endpoint().Endpoints()
	if err != nil {
		return httperror.InternalServerError("Unable to retrieve environments from the database", err)
	}

	settings, err := handler.DataStore.Settings().Settings()
	if err != nil {
		return httperror.InternalServerError("Unable to retrieve settings from the database", err)
	}

	securityContext, err := security.RetrieveRestrictedRequestContext(r)
	if err != nil {
		return httperror.InternalServerError("Unable to retrieve info from request context", err)
	}

	query, err := parseQuery(r)
	if err != nil {
		return httperror.BadRequest("Invalid query parameters", err)
	}

	filteredEndpoints := security.FilterEndpoints(endpoints, endpointGroups, securityContext)

	filteredEndpoints, totalAvailableEndpoints, err := handler.filterEndpointsByQuery(filteredEndpoints, query, endpointGroups, settings)
	if err != nil {
		return httperror.InternalServerError("Unable to filter endpoints", err)
	}

	sortEndpointsByField(filteredEndpoints, endpointGroups, sortField, sortOrder == "desc")

	filteredEndpointCount := len(filteredEndpoints)

	paginatedEndpoints := paginateEndpoints(filteredEndpoints, start, limit)

	for idx := range paginatedEndpoints {
		hideFields(&paginatedEndpoints[idx])
		paginatedEndpoints[idx].ComposeSyntaxMaxVersion = handler.ComposeStackManager.ComposeSyntaxMaxVersion()
		if paginatedEndpoints[idx].EdgeCheckinInterval == 0 {
			paginatedEndpoints[idx].EdgeCheckinInterval = settings.EdgeAgentCheckinInterval
		}
		paginatedEndpoints[idx].QueryDate = time.Now().Unix()
		if !query.excludeSnapshots {
			err = handler.SnapshotService.FillSnapshotData(&paginatedEndpoints[idx])
			if err != nil {
				return httperror.InternalServerError("Unable to add snapshot data", err)
			}
		}
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

	if start < 0 {
		start = 0
	}

	if start > endpointCount {
		start = endpointCount
	}

	end := start + limit
	if end > endpointCount {
		end = endpointCount
	}

	return endpoints[start:end]
}

func sortEndpointsByField(endpoints []portainer.Endpoint, endpointGroups []portainer.EndpointGroup, sortField string, isSortDesc bool) {

	switch sortField {
	case "Name":
		if isSortDesc {
			sort.Stable(sort.Reverse(EndpointsByName(endpoints)))
		} else {
			sort.Stable(EndpointsByName(endpoints))
		}

	case "Group":
		endpointGroupNames := make(map[portainer.EndpointGroupID]string, 0)
		for _, group := range endpointGroups {
			endpointGroupNames[group.ID] = group.Name
		}

		endpointsByGroup := EndpointsByGroup{
			endpointGroupNames: endpointGroupNames,
			endpoints:          endpoints,
		}

		if isSortDesc {
			sort.Stable(sort.Reverse(endpointsByGroup))
		} else {
			sort.Stable(endpointsByGroup)
		}

	case "Status":
		if isSortDesc {
			sort.Slice(endpoints, func(i, j int) bool {
				return endpoints[i].Status > endpoints[j].Status
			})
		} else {
			sort.Slice(endpoints, func(i, j int) bool {
				return endpoints[i].Status < endpoints[j].Status
			})
		}
	}
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
