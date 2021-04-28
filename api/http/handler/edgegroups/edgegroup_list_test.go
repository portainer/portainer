package edgegroups

import (
	"testing"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/internal/testhelpers"
	"github.com/stretchr/testify/assert"
)

func Test_getEndpointTypes(t *testing.T) {
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
		expected    []portainer.EndpointType
	}{
		{endpointIds: []int{1}, expected: []portainer.EndpointType{portainer.DockerEnvironment}},
		{endpointIds: []int{2}, expected: []portainer.EndpointType{portainer.AgentOnDockerEnvironment}},
		{endpointIds: []int{3}, expected: []portainer.EndpointType{portainer.AzureEnvironment}},
		{endpointIds: []int{4}, expected: []portainer.EndpointType{portainer.EdgeAgentOnDockerEnvironment}},
		{endpointIds: []int{5}, expected: []portainer.EndpointType{portainer.KubernetesLocalEnvironment}},
		{endpointIds: []int{6}, expected: []portainer.EndpointType{portainer.AgentOnKubernetesEnvironment}},
		{endpointIds: []int{7}, expected: []portainer.EndpointType{portainer.EdgeAgentOnKubernetesEnvironment}},
		{endpointIds: []int{7, 2}, expected: []portainer.EndpointType{portainer.EdgeAgentOnKubernetesEnvironment, portainer.AgentOnDockerEnvironment}},
		{endpointIds: []int{6, 4, 1}, expected: []portainer.EndpointType{portainer.AgentOnKubernetesEnvironment, portainer.EdgeAgentOnDockerEnvironment, portainer.DockerEnvironment}},
		{endpointIds: []int{1, 2, 3}, expected: []portainer.EndpointType{portainer.DockerEnvironment, portainer.AgentOnDockerEnvironment, portainer.AzureEnvironment}},
	}

	for _, test := range tests {
		endpointIds := convertIntList(test.endpointIds)
		ans, err := getEndpointTypes(datastore.Endpoint(), endpointIds)
		assert.NoError(t, err, "getEndpointTypes shouldn't fail")

		assert.ElementsMatch(t, test.expected, ans, "getEndpointTypes expected to return %b for %v, but returned %b", test.expected, endpointIds, ans)
	}
}

func Test_getEndpointTypes_failWhenEndpointDontExist(t *testing.T) {
	datastore := testhelpers.NewDatastore(testhelpers.WithEndpoints([]portainer.Endpoint{}))

	_, err := getEndpointTypes(datastore.Endpoint(), []portainer.EndpointID{1})
	assert.Error(t, err, "getEndpointTypes should fail")
}

func convertIntList(list []int) []portainer.EndpointID {
	ids := []portainer.EndpointID{}

	for _, i := range list {
		ids = append(ids, portainer.EndpointID(i))
	}

	return ids
}
