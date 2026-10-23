package endpoints

import (
	"io"
	"net/http"
	"net/http/httptest"
	"testing"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/http/security"
	"github.com/portainer/portainer/api/internal/testhelpers"

	"github.com/segmentio/encoding/json"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func agentVersionsEndpoint(id portainer.EndpointID, endpointType portainer.EndpointType, version string) portainer.Endpoint {
	return portainer.Endpoint{
		ID:      id,
		GroupID: 1,
		Type:    endpointType,
		Agent:   portainer.EnvironmentAgentData{Version: version},
	}
}

func Test_AgentVersions(t *testing.T) {
	t.Parallel()

	tests := []struct {
		title     string
		endpoints []portainer.Endpoint
		expected  []string
	}{
		{
			title:     "no environments returns an empty list",
			endpoints: []portainer.Endpoint{},
			expected:  []string{},
		},
		{
			title: "excludes a local Docker environment carrying a stray agent version",
			endpoints: []portainer.Endpoint{
				agentVersionsEndpoint(1, portainer.DockerEnvironment, "2.1.0"),
			},
			expected: []string{},
		},
		{
			title: "excludes a local Kubernetes environment carrying a stray agent version",
			endpoints: []portainer.Endpoint{
				agentVersionsEndpoint(1, portainer.KubernetesLocalEnvironment, "2.1.0"),
			},
			expected: []string{},
		},
		{
			title: "excludes an Azure environment carrying a stray agent version",
			endpoints: []portainer.Endpoint{
				agentVersionsEndpoint(1, portainer.AzureEnvironment, "2.1.0"),
			},
			expected: []string{},
		},
		{
			title: "includes a regular Docker agent environment",
			endpoints: []portainer.Endpoint{
				agentVersionsEndpoint(1, portainer.AgentOnDockerEnvironment, "2.39.0"),
			},
			expected: []string{"2.39.0"},
		},
		{
			title: "includes an Edge Docker agent environment",
			endpoints: []portainer.Endpoint{
				agentVersionsEndpoint(1, portainer.EdgeAgentOnDockerEnvironment, "2.39.0"),
			},
			expected: []string{"2.39.0"},
		},
		{
			title: "includes a regular Kubernetes agent environment",
			endpoints: []portainer.Endpoint{
				agentVersionsEndpoint(1, portainer.AgentOnKubernetesEnvironment, "2.39.0"),
			},
			expected: []string{"2.39.0"},
		},
		{
			title: "includes an Edge Kubernetes agent environment",
			endpoints: []portainer.Endpoint{
				agentVersionsEndpoint(1, portainer.EdgeAgentOnKubernetesEnvironment, "2.39.0"),
			},
			expected: []string{"2.39.0"},
		},
		{
			title: "excludes an agent environment that has not reported a version yet",
			endpoints: []portainer.Endpoint{
				agentVersionsEndpoint(1, portainer.AgentOnDockerEnvironment, ""),
			},
			expected: []string{},
		},
		{
			title: "deduplicates identical versions reported by multiple agent environments",
			endpoints: []portainer.Endpoint{
				agentVersionsEndpoint(1, portainer.AgentOnDockerEnvironment, "2.39.0"),
				agentVersionsEndpoint(2, portainer.AgentOnKubernetesEnvironment, "2.39.0"),
			},
			expected: []string{"2.39.0"},
		},
		{
			title: "mixed fleet: only distinct agent versions surface, non-agent noise is excluded",
			endpoints: []portainer.Endpoint{
				agentVersionsEndpoint(1, portainer.AgentOnDockerEnvironment, "2.38.1"),
				agentVersionsEndpoint(2, portainer.AgentOnDockerEnvironment, "2.39.0"),
				agentVersionsEndpoint(3, portainer.EdgeAgentOnDockerEnvironment, "2.39.0"),
				agentVersionsEndpoint(4, portainer.DockerEnvironment, "2.1.0"),
				agentVersionsEndpoint(5, portainer.AgentOnDockerEnvironment, ""),
			},
			expected: []string{"2.38.1", "2.39.0"},
		},
	}

	for _, test := range tests {
		t.Run(test.title, func(t *testing.T) {
			handler := setupEndpointListHandler(t, test.endpoints)

			req := buildAgentVersionsRequest()

			rr := httptest.NewRecorder()
			handler.ServeHTTP(rr, req)

			require.Equal(t, http.StatusOK, rr.Code)

			body, err := io.ReadAll(rr.Body)
			require.NoError(t, err)

			var versions []string
			require.NoError(t, json.Unmarshal(body, &versions))

			assert.ElementsMatch(t, test.expected, versions)
		})
	}
}

func buildAgentVersionsRequest() *http.Request {
	req := httptest.NewRequest(http.MethodGet, "/endpoints/agent_versions", nil)

	ctx := security.StoreTokenData(req, &portainer.TokenData{ID: 1, Username: "admin", Role: 1})
	req = req.WithContext(ctx)

	restrictedCtx := security.StoreRestrictedRequestContext(req, &security.RestrictedRequestContext{UserID: 1, IsAdmin: true})
	req = req.WithContext(restrictedCtx)

	testhelpers.AddTestSecurityCookie(req, "Bearer dummytoken")

	return req
}
