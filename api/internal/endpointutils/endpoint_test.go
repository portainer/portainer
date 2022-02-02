package endpointutils

import (
	"testing"

	portainer "github.com/portainer/portainer/api"
	"github.com/stretchr/testify/assert"
)

type isEndpointTypeTest struct {
	endpointType portainer.EndpointType
	expected     bool
}

func Test_IsDockerEndpoint(t *testing.T) {
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
				assert.Equal(t, 0, len(output))
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
				assert.Equal(t, 2, len(output))
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
