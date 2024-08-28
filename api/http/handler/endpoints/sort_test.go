package endpoints

import (
	"testing"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/slicesx"

	"github.com/stretchr/testify/assert"
)

func TestSortEndpointsByField(t *testing.T) {
	environments := []portainer.Endpoint{
		{ID: 0, Name: "Environment 1", GroupID: 1, Status: 1, LastCheckInDate: 3, EdgeID: "edge32"},
		{ID: 1, Name: "Environment 2", GroupID: 2, Status: 2, LastCheckInDate: 6, EdgeID: "edge57"},
		{ID: 2, Name: "Environment 3", GroupID: 1, Status: 3, LastCheckInDate: 2, EdgeID: "test87"},
		{ID: 3, Name: "Environment 4", GroupID: 2, Status: 4, LastCheckInDate: 1, EdgeID: "abc123"},
	}

	environmentGroups := []portainer.EndpointGroup{
		{ID: 1, Name: "Group 1"},
		{ID: 2, Name: "Group 2"},
	}

	tests := []struct {
		name       string
		sortField  sortKey
		isSortDesc bool
		expected   []portainer.EndpointID
	}{
		{
			name:      "sort without value",
			sortField: "",
			expected: []portainer.EndpointID{
				environments[0].ID,
				environments[1].ID,
				environments[2].ID,
				environments[3].ID,
			},
		},
		{
			name:       "sort by name ascending",
			sortField:  "Name",
			isSortDesc: false,
			expected: []portainer.EndpointID{
				environments[0].ID,
				environments[1].ID,
				environments[2].ID,
				environments[3].ID,
			},
		},
		{
			name:       "sort by name descending",
			sortField:  "Name",
			isSortDesc: true,
			expected: []portainer.EndpointID{
				environments[3].ID,
				environments[2].ID,
				environments[1].ID,
				environments[0].ID,
			},
		},
		{
			name:       "sort by group name ascending",
			sortField:  "Group",
			isSortDesc: false,
			expected: []portainer.EndpointID{
				environments[0].ID,
				environments[2].ID,
				environments[1].ID,
				environments[3].ID,
			},
		},
		{
			name:       "sort by group name descending",
			sortField:  "Group",
			isSortDesc: true,
			expected: []portainer.EndpointID{
				environments[1].ID,
				environments[3].ID,
				environments[0].ID,
				environments[2].ID,
			},
		},

		{
			name:       "sort by status ascending",
			sortField:  "Status",
			isSortDesc: false,
			expected: []portainer.EndpointID{
				environments[0].ID,
				environments[1].ID,
				environments[2].ID,
				environments[3].ID,
			},
		},
		{
			name:       "sort by status descending",
			sortField:  "Status",
			isSortDesc: true,
			expected: []portainer.EndpointID{
				environments[3].ID,
				environments[2].ID,
				environments[1].ID,
				environments[0].ID,
			},
		},
		{
			name:       "sort by last check-in ascending",
			sortField:  "LastCheckIn",
			isSortDesc: false,
			expected: []portainer.EndpointID{
				environments[3].ID,
				environments[2].ID,
				environments[0].ID,
				environments[1].ID,
			},
		},
		{
			name:       "sort by last check-in descending",
			sortField:  "LastCheckIn",
			isSortDesc: true,
			expected: []portainer.EndpointID{
				environments[1].ID,
				environments[0].ID,
				environments[2].ID,
				environments[3].ID,
			},
		},
		{
			name:      "sort by edge ID ascending",
			sortField: "EdgeID",
			expected: []portainer.EndpointID{
				environments[3].ID,
				environments[0].ID,
				environments[1].ID,
				environments[2].ID,
			},
		},
		{
			name:       "sort by edge ID descending",
			sortField:  "EdgeID",
			isSortDesc: true,
			expected: []portainer.EndpointID{
				environments[2].ID,
				environments[1].ID,
				environments[0].ID,
				environments[3].ID,
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			is := assert.New(t)
			sortEnvironmentsByField(environments, environmentGroups, "Name", false) // reset to default sort order

			sortEnvironmentsByField(environments, environmentGroups, tt.sortField, tt.isSortDesc)

			is.Equal(tt.expected, getEndpointIDs(environments))
		})
	}
}

func getEndpointIDs(environments []portainer.Endpoint) []portainer.EndpointID {
	return slicesx.Map(environments, func(environment portainer.Endpoint) portainer.EndpointID {
		return environment.ID
	})
}
