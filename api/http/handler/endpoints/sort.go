package endpoints

import (
	"slices"
	"sort"
	"strings"

	"github.com/fvbommel/sortorder"
	portainer "github.com/portainer/portainer/api"
)

func sortEnvironmentsByField(environments []portainer.Endpoint, environmentGroups []portainer.EndpointGroup, sortField sortKey, isSortDesc bool) {

	switch sortField {
	case sortKeyName:
		sortData := EnvironmentsByKey{
			environments: environments,
			valueGetter:  func(environment portainer.Endpoint) string { return environment.Name },
			desc:         isSortDesc,
		}
		sort.Stable(sortData)

	case sortKeyGroup:
		environmentGroupNames := make(map[portainer.EndpointGroupID]string, 0)
		for _, group := range environmentGroups {
			environmentGroupNames[group.ID] = group.Name
		}

		sortData := EnvironmentsByKey{
			environments: environments,
			valueGetter:  func(environment portainer.Endpoint) string { return environmentGroupNames[environment.GroupID] },
			desc:         isSortDesc,
		}

		sort.Stable(sortData)

	case sortKeyStatus:
		if isSortDesc {
			sort.Slice(environments, func(i, j int) bool {
				return environments[i].Status > environments[j].Status
			})
		} else {
			sort.Slice(environments, func(i, j int) bool {
				return environments[i].Status < environments[j].Status
			})
		}
	case sortKeyLastCheckInDate:
		slices.SortStableFunc(environments, func(a, b portainer.Endpoint) int {
			mul := 1
			if isSortDesc {
				mul = -1
			}

			return int(a.LastCheckInDate-b.LastCheckInDate) * mul
		})
	case sortKeyEdgeID:
		sortData := EnvironmentsByKey{
			environments: environments,
			valueGetter:  func(environment portainer.Endpoint) string { return environment.EdgeID },
			desc:         isSortDesc,
		}
		sort.Stable(sortData)

	}

}

type EnvironmentsByKey struct {
	environments []portainer.Endpoint
	valueGetter  func(portainer.Endpoint) string
	desc         bool
}

func (e EnvironmentsByKey) Len() int {
	return len(e.environments)
}

func (e EnvironmentsByKey) Swap(i, j int) {
	e.environments[i], e.environments[j] = e.environments[j], e.environments[i]
}

func (e EnvironmentsByKey) Less(i, j int) bool {
	vi := strings.ToLower(e.valueGetter(e.environments[i]))
	vj := strings.ToLower(e.valueGetter(e.environments[j]))

	if e.desc {
		return sortorder.NaturalLess(vj, vi)
	} else {
		return sortorder.NaturalLess(vi, vj)
	}
}

type sortKey string

const (
	sortKeyName            sortKey = "Name"
	sortKeyGroup           sortKey = "Group"
	sortKeyStatus          sortKey = "Status"
	sortKeyLastCheckInDate sortKey = "LastCheckIn"
	sortKeyEdgeID          sortKey = "EdgeID"
)

func getSortKey(sortField string) sortKey {
	fieldAsSortKey := sortKey(sortField)
	if slices.Contains([]sortKey{sortKeyName, sortKeyGroup, sortKeyStatus, sortKeyLastCheckInDate, sortKeyEdgeID}, fieldAsSortKey) {
		return fieldAsSortKey
	}

	return ""
}
