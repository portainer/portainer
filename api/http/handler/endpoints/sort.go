package endpoints

import (
	"slices"
	"strings"

	"github.com/fvbommel/sortorder"
	portainer "github.com/portainer/portainer/api"
)

type comp[T any] func(a, b T) int

func stringComp(a, b string) int {
	if sortorder.NaturalLess(a, b) {
		return -1
	} else if sortorder.NaturalLess(b, a) {
		return 1
	} else {
		return 0
	}
}

func sortEnvironmentsByField(environments []portainer.Endpoint, environmentGroups []portainer.EndpointGroup, sortField sortKey, isSortDesc bool) {
	var less comp[portainer.Endpoint]
	switch sortField {
	case sortKeyName:
		less = func(a, b portainer.Endpoint) int {
			return stringComp(a.Name, b.Name)
		}

	case sortKeyGroup:
		environmentGroupNames := make(map[portainer.EndpointGroupID]string, 0)
		for _, group := range environmentGroups {
			environmentGroupNames[group.ID] = group.Name
		}

		less = func(a, b portainer.Endpoint) int {
			aGroup := environmentGroupNames[a.GroupID]
			bGroup := environmentGroupNames[b.GroupID]

			return stringComp(aGroup, bGroup)
		}

	case sortKeyStatus:
		less = func(a, b portainer.Endpoint) int {
			return int(a.Status - b.Status)
		}

	case sortKeyLastCheckInDate:
		less = func(a, b portainer.Endpoint) int {
			return int(a.LastCheckInDate - b.LastCheckInDate)
		}
	case sortKeyEdgeID:
		less = func(a, b portainer.Endpoint) int {
			return stringComp(a.EdgeID, b.EdgeID)
		}

	}

	slices.SortStableFunc(environments, func(a, b portainer.Endpoint) int {
		mul := 1
		if isSortDesc {
			mul = -1
		}

		return less(a, b) * mul
	})

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
