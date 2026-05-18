package endpoints

import (
	"slices"

	"github.com/fvbommel/sortorder"
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/internal/endpointutils"
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

func healthRank(endpoint *portainer.Endpoint, settings *portainer.Settings) int {
	status := resolveEndpointStatus(endpoint, settings)
	if status == statusDown {
		return 0
	}
	if isOutdated(endpoint) {
		return 1
	}
	if status == statusHeartbeat {
		return 2
	}
	return 3
}

func sortEnvironmentsByField(environments []portainer.Endpoint, environmentGroups []portainer.EndpointGroup, sortField sortKey, isSortDesc bool, settings *portainer.Settings) {
	if sortField == "" {
		return
	}

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

		// set the "unassigned" group name to be empty string
		environmentGroupNames[1] = ""

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

	case sortKeyPlatformType:
		less = func(a, b portainer.Endpoint) int {
			return int(endpointutils.EndpointPlatformType(&a) - endpointutils.EndpointPlatformType(&b))
		}
	case sortKeyHealth:
		less = func(a, b portainer.Endpoint) int {
			return healthRank(&a, settings) - healthRank(&b, settings)
		}
	case sortKeyId:
		less = func(a, b portainer.Endpoint) int {
			return int(a.ID - b.ID)
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

type sortKey string

const (
	sortKeyName            sortKey = "Name"
	sortKeyGroup           sortKey = "Group"
	sortKeyStatus          sortKey = "Status"
	sortKeyLastCheckInDate sortKey = "LastCheckIn"
	sortKeyEdgeID          sortKey = "EdgeID"
	sortKeyPlatformType    sortKey = "PlatformType"
	sortKeyHealth          sortKey = "Health"
	sortKeyId              sortKey = "Id"
)

func getSortKey(sortField string) sortKey {
	fieldAsSortKey := sortKey(sortField)
	if slices.Contains([]sortKey{sortKeyName, sortKeyGroup, sortKeyStatus, sortKeyLastCheckInDate, sortKeyEdgeID, sortKeyPlatformType, sortKeyHealth, sortKeyId}, fieldAsSortKey) {
		return fieldAsSortKey
	}

	return ""
}
