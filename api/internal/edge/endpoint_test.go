package edge_test

import (
	"testing"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/datastore"
	"github.com/portainer/portainer/api/internal/edge"
	"github.com/portainer/portainer/api/roar"

	"github.com/stretchr/testify/require"
)

func TestEndpointInEdgeGroup(t *testing.T) {
	t.Parallel()
	_, store := datastore.MustNewTestStore(t, true, false)

	endpointGroups := []portainer.EndpointGroup{{ID: 1, Name: "test-group"}}

	endpoint := &portainer.Endpoint{
		ID:          1,
		Name:        "test-endpoint",
		Type:        portainer.EdgeAgentOnDockerEnvironment,
		UserTrusted: true,
		GroupID:     endpointGroups[0].ID,
	}
	edgeGroupID := portainer.EdgeGroupID(1)

	untrustedEndpoint := &portainer.Endpoint{
		ID:          2,
		Name:        "untrusted-endpoint",
		Type:        portainer.EdgeAgentOnDockerEnvironment,
		UserTrusted: false,
		GroupID:     endpointGroups[0].ID,
	}

	nonEdgeEndpoint := &portainer.Endpoint{
		ID:          2,
		Name:        "untrusted-endpoint",
		Type:        portainer.AgentOnDockerEnvironment,
		UserTrusted: true,
		GroupID:     endpointGroups[0].ID,
	}

	err := store.EdgeGroup().Create(&portainer.EdgeGroup{
		ID:          edgeGroupID,
		Name:        "test-edge-group",
		Dynamic:     false,
		EndpointIDs: roar.FromSlice([]portainer.EndpointID{endpoint.ID, untrustedEndpoint.ID}),
	})
	require.NoError(t, err)

	// Related endpoint in a static edge group

	inEdgeGroup, _, err := edge.EndpointInEdgeGroup(store, endpoint, edgeGroupID, endpointGroups)
	require.NoError(t, err)
	require.True(t, inEdgeGroup)

	// Unrelated endpoint in a static edge group

	unrelatedEndpoint := &portainer.Endpoint{
		ID:          3,
		Name:        "unrelated-endpoint",
		Type:        portainer.EdgeAgentOnDockerEnvironment,
		UserTrusted: true,
		GroupID:     0,
	}

	inEdgeGroup, _, err = edge.EndpointInEdgeGroup(store, unrelatedEndpoint, edgeGroupID, endpointGroups)
	require.NoError(t, err)
	require.False(t, inEdgeGroup)

	// Untrusted endpoint

	inEdgeGroup, _, err = edge.EndpointInEdgeGroup(store, untrustedEndpoint, edgeGroupID, endpointGroups)
	require.NoError(t, err)
	require.False(t, inEdgeGroup)

	// Non-edge endpoint

	inEdgeGroup, _, err = edge.EndpointInEdgeGroup(store, nonEdgeEndpoint, edgeGroupID, endpointGroups)
	require.NoError(t, err)
	require.False(t, inEdgeGroup)
}
