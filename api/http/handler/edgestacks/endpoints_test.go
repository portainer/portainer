package edgestacks

import (
	"testing"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/internal/testhelpers"
	"github.com/stretchr/testify/assert"
)

func Test_hasKubeEndpoint(t *testing.T) {
	endpoints := []portainer.Endpoint{
		{ID: portainer.EndpointID(1), Type: portainer.DockerEnvironment},
		{ID: portainer.EndpointID(2), Type: portainer.AgentOnDockerEnvironment},
		{ID: portainer.EndpointID(3), Type: portainer.AzureEnvironment},
		{ID: portainer.EndpointID(4), Type: portainer.EdgeAgentOnDockerEnvironment},
		{ID: portainer.EndpointID(5), Type: portainer.KubernetesLocalEnvironment},
		{ID: portainer.EndpointID(6), Type: portainer.AgentOnKubernetesEnvironment},
		{ID: portainer.EndpointID(7), Type: portainer.EdgeAgentOnKubernetesEnvironment},
	}

	datastore := testhelpers.NewDatastore(testhelpers.WithEndpoints(endpoints))

	tests := []struct {
		endpointIds []int
		expected    bool
	}{
		{endpointIds: []int{1}, expected: false},
		{endpointIds: []int{2}, expected: false},
		{endpointIds: []int{3}, expected: false},
		{endpointIds: []int{4}, expected: false},
		{endpointIds: []int{5}, expected: true},
		{endpointIds: []int{6}, expected: true},
		{endpointIds: []int{7}, expected: true},
		{endpointIds: []int{7, 2}, expected: true},
		{endpointIds: []int{6, 4, 1}, expected: true},
		{endpointIds: []int{1, 2, 3}, expected: false},
	}

	for _, test := range tests {
		endpointIds := convertIntList(test.endpointIds)
		ans, err := hasKubeEndpoint(datastore.Endpoint(), endpointIds)
		assert.NoError(t, err, "hasKubeEndpoint shouldn't fail")

		assert.Equal(t, test.expected, ans, "hasKubeEndpoint expected to return %b for %v, but returned %b", test.expected, endpointIds, ans)
	}
}

func Test_hasKubeEndpoint_failWhenEndpointDontExist(t *testing.T) {
	datastore := testhelpers.NewDatastore(testhelpers.WithEndpoints([]portainer.Endpoint{}))

	_, err := hasKubeEndpoint(datastore.Endpoint(), []portainer.EndpointID{1})
	assert.Error(t, err, "hasKubeEndpoint should fail")
}

func convertIntList(list []int) []portainer.EndpointID {
	ids := []portainer.EndpointID{}

	for _, i := range list {
		ids = append(ids, portainer.EndpointID(i))
	}

	return ids
}
