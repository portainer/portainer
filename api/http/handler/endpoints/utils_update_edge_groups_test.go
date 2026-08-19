package endpoints

import (
	"testing"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	"github.com/portainer/portainer/api/datastore"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func Test_updateEdgeGroups(t *testing.T) {
	t.Parallel()
	createGroups := func(store *datastore.Store, names []string) ([]portainer.EdgeGroup, error) {
		groups := make([]portainer.EdgeGroup, len(names))
		for index, name := range names {
			group := &portainer.EdgeGroup{
				Name:    name,
				Dynamic: false,
				TagIDs:  make([]portainer.TagID, 0),
			}

			if err := store.EdgeGroup().Create(group); err != nil {
				return nil, err
			}

			groups[index] = *group
		}

		return groups, nil
	}

	checkGroups := func(store *datastore.Store, is *assert.Assertions, groupIDs []portainer.EdgeGroupID, endpointID portainer.EndpointID) {
		for _, groupID := range groupIDs {
			group, err := store.EdgeGroup().Read(groupID)
			require.NoError(t, err)

			is.True(group.EndpointIDs.Contains(endpointID),
				"expected endpoint to be in group")
		}
	}

	groupsByName := func(groups []portainer.EdgeGroup, groupNames []string) []portainer.EdgeGroup {
		result := make([]portainer.EdgeGroup, len(groupNames))
		for i, tagName := range groupNames {
			for j, tag := range groups {
				if tag.Name == tagName {
					result[i] = groups[j]

					break
				}
			}
		}

		return result
	}

	type testCase struct {
		title              string
		endpoint           *portainer.Endpoint
		groupNames         []string
		endpointGroupNames []string
		groupsToApply      []string
		shouldNotBeUpdated bool
	}

	testFn := func(t *testing.T, testCase testCase) {
		is := assert.New(t)
		_, store := datastore.MustNewTestStore(t, false, true)

		err := store.Endpoint().Create(testCase.endpoint)
		require.NoError(t, err)

		groups, err := createGroups(store, testCase.groupNames)
		require.NoError(t, err)

		endpointGroups := groupsByName(groups, testCase.endpointGroupNames)
		for _, group := range endpointGroups {
			group.EndpointIDs.Add(testCase.endpoint.ID)

			err = store.EdgeGroup().Update(group.ID, &group)
			require.NoError(t, err)
		}

		expectedGroups := groupsByName(groups, testCase.groupsToApply)

		expectedIDs := make([]portainer.EdgeGroupID, len(expectedGroups))
		for i, tag := range expectedGroups {
			expectedIDs[i] = tag.ID
		}

		err = store.UpdateTx(func(tx dataservices.DataStoreTx) error {
			updated, err := updateEnvironmentEdgeGroups(tx, expectedIDs, testCase.endpoint.ID)
			require.NoError(t, err)

			is.Equal(testCase.shouldNotBeUpdated, !updated)

			return nil
		})

		require.NoError(t, err)

		checkGroups(store, is, expectedIDs, testCase.endpoint.ID)
	}

	testCases := []testCase{
		{
			title:              "applying edge groups to an endpoint without edge groups",
			endpoint:           &portainer.Endpoint{},
			groupNames:         []string{"edge group1", "edge group2", "edge group3"},
			endpointGroupNames: []string{},
			groupsToApply:      []string{"edge group1", "edge group2", "edge group3"},
		},
		{
			title:              "applying edge groups to an endpoint with edge groups",
			endpoint:           &portainer.Endpoint{},
			groupNames:         []string{"edge group1", "edge group2", "edge group3", "edge group4", "edge group5", "edge group6"},
			endpointGroupNames: []string{"edge group1", "edge group2", "edge group3"},
			groupsToApply:      []string{"edge group4", "edge group5", "edge group6"},
		},
		{
			title:              "applying edge groups to an endpoint with edge groups that are already applied",
			endpoint:           &portainer.Endpoint{},
			groupNames:         []string{"edge group1", "edge group2", "edge group3"},
			endpointGroupNames: []string{"edge group1", "edge group2", "edge group3"},
			groupsToApply:      []string{"edge group1", "edge group2", "edge group3"},
			shouldNotBeUpdated: true,
		},
		{
			title:              "adding new edge groups to an endpoint with edge groups ",
			endpoint:           &portainer.Endpoint{},
			groupNames:         []string{"edge group1", "edge group2", "edge group3", "edge group4", "edge group5", "edge group6"},
			endpointGroupNames: []string{"edge group1", "edge group2", "edge group3"},
			groupsToApply:      []string{"edge group1", "edge group2", "edge group3", "edge group4", "edge group5", "edge group6"},
		},
		{
			title:              "mixing edge groups that are already applied and new edge groups",
			endpoint:           &portainer.Endpoint{},
			groupNames:         []string{"edge group1", "edge group2", "edge group3", "edge group4", "edge group5", "edge group6"},
			endpointGroupNames: []string{"edge group1", "edge group2", "edge group3"},
			groupsToApply:      []string{"edge group2", "edge group4", "edge group5"},
		},
	}

	for _, testCase := range testCases {
		t.Run(testCase.title, func(t *testing.T) {
			testFn(t, testCase)
		})
	}
}
