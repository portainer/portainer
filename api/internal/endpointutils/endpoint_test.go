package endpointutils

import (
	"testing"
	"time"

	portainer "github.com/portainer/portainer/api"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

type isEndpointTypeTest struct {
	endpointType portainer.EndpointType
	expected     bool
}

func Test_IsDockerEndpoint(t *testing.T) {
	t.Parallel()
	tests := []isEndpointTypeTest{
		{endpointType: portainer.DockerEnvironment, expected: true},
		{endpointType: portainer.AgentOnDockerEnvironment, expected: true},
		{endpointType: portainer.AzureEnvironment, expected: false},
		{endpointType: portainer.EdgeAgentOnDockerEnvironment, expected: true},
		{endpointType: portainer.KubernetesLocalEnvironment, expected: false},
		{endpointType: portainer.AgentOnKubernetesEnvironment, expected: false},
		{endpointType: portainer.EdgeAgentOnKubernetesEnvironment, expected: false},
	}

	for _, test := range tests {
		ans := IsDockerEndpoint(&portainer.Endpoint{Type: test.endpointType})
		assert.Equal(t, test.expected, ans)
	}
}

func Test_IsKubernetesEndpoint(t *testing.T) {
	t.Parallel()
	tests := []isEndpointTypeTest{
		{endpointType: portainer.DockerEnvironment, expected: false},
		{endpointType: portainer.AgentOnDockerEnvironment, expected: false},
		{endpointType: portainer.AzureEnvironment, expected: false},
		{endpointType: portainer.EdgeAgentOnDockerEnvironment, expected: false},
		{endpointType: portainer.KubernetesLocalEnvironment, expected: true},
		{endpointType: portainer.AgentOnKubernetesEnvironment, expected: true},
		{endpointType: portainer.EdgeAgentOnKubernetesEnvironment, expected: true},
	}

	for _, test := range tests {
		ans := IsKubernetesEndpoint(&portainer.Endpoint{Type: test.endpointType})
		assert.Equal(t, test.expected, ans)
	}
}

func Test_IsAgentEndpoint(t *testing.T) {
	t.Parallel()
	tests := []isEndpointTypeTest{
		{endpointType: portainer.DockerEnvironment, expected: false},
		{endpointType: portainer.AgentOnDockerEnvironment, expected: true},
		{endpointType: portainer.AzureEnvironment, expected: false},
		{endpointType: portainer.EdgeAgentOnDockerEnvironment, expected: true},
		{endpointType: portainer.KubernetesLocalEnvironment, expected: false},
		{endpointType: portainer.AgentOnKubernetesEnvironment, expected: true},
		{endpointType: portainer.EdgeAgentOnKubernetesEnvironment, expected: true},
	}

	for _, test := range tests {
		ans := IsAgentEndpoint(&portainer.Endpoint{Type: test.endpointType})
		assert.Equal(t, test.expected, ans)
	}
}

func Test_FilterByExcludeIDs(t *testing.T) {
	t.Parallel()
	tests := []struct {
		name            string
		inputArray      []portainer.Endpoint
		inputExcludeIDs []portainer.EndpointID
		asserts         func(*testing.T, []portainer.Endpoint)
	}{
		{
			name: "filter endpoints",
			inputArray: []portainer.Endpoint{
				{ID: portainer.EndpointID(1)},
				{ID: portainer.EndpointID(2)},
				{ID: portainer.EndpointID(3)},
				{ID: portainer.EndpointID(4)},
			},
			inputExcludeIDs: []portainer.EndpointID{
				portainer.EndpointID(2),
				portainer.EndpointID(3),
			},
			asserts: func(t *testing.T, output []portainer.Endpoint) {
				assert.Contains(t, output, portainer.Endpoint{ID: portainer.EndpointID(1)})
				assert.NotContains(t, output, portainer.Endpoint{ID: portainer.EndpointID(2)})
				assert.NotContains(t, output, portainer.Endpoint{ID: portainer.EndpointID(3)})
				assert.Contains(t, output, portainer.Endpoint{ID: portainer.EndpointID(4)})
			},
		},
		{
			name:       "empty input",
			inputArray: []portainer.Endpoint{},
			inputExcludeIDs: []portainer.EndpointID{
				portainer.EndpointID(2),
			},
			asserts: func(t *testing.T, output []portainer.Endpoint) {
				assert.Empty(t, output)
			},
		},
		{
			name: "no filter",
			inputArray: []portainer.Endpoint{
				{ID: portainer.EndpointID(1)},
				{ID: portainer.EndpointID(2)},
			},
			inputExcludeIDs: []portainer.EndpointID{},
			asserts: func(t *testing.T, output []portainer.Endpoint) {
				assert.Len(t, output, 2)
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			output := FilterByExcludeIDs(tt.inputArray, tt.inputExcludeIDs)
			tt.asserts(t, output)
		})
	}
}

func TestUpdateEdgeEndpointHeartbeat(t *testing.T) {
	t.Parallel()
	endpoint := &portainer.Endpoint{
		Type:                portainer.EdgeAgentOnDockerEnvironment,
		LastCheckInDate:     time.Now().Unix(),
		EdgeCheckinInterval: 5,
	}

	UpdateEdgeEndpointHeartbeat(endpoint, &portainer.Settings{})
	require.True(t, endpoint.Heartbeat)

	endpoint.LastCheckInDate = time.Now().Add(-time.Minute).Unix()
	UpdateEdgeEndpointHeartbeat(endpoint, &portainer.Settings{})
	require.False(t, endpoint.Heartbeat)
}
