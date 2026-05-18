package endpoints

import (
	"io"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/datastore"
	"github.com/portainer/portainer/api/http/security"
	"github.com/portainer/portainer/api/internal/testhelpers"
	"github.com/segmentio/encoding/json"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestSummaryCounts(t *testing.T) {
	type testEndpoint struct {
		endpointType    portainer.EndpointType
		status          portainer.EndpointStatus
		groupID         portainer.EndpointGroupID
		agentVersion    string
		containerEngine string
		userTrusted     bool
		lastCheckInDate int64
	}

	currentVersion := portainer.APIVersion

	tests := []struct {
		name           string
		endpoints      []testEndpoint
		expectedCounts EnvironmentSummaryCountsResponse
	}{
		{
			name: "all docker endpoints up",
			endpoints: []testEndpoint{
				{endpointType: portainer.DockerEnvironment, status: portainer.EndpointStatusUp, groupID: 2, agentVersion: currentVersion},
				{endpointType: portainer.DockerEnvironment, status: portainer.EndpointStatusUp, groupID: 2, agentVersion: currentVersion},
			},
			expectedCounts: EnvironmentSummaryCountsResponse{
				Total: 2, Up: 2, Down: 0, Outdated: 0, Unassigned: 0,
				// GroupID 2 has no matching EndpointGroup in the test store.
				ByGroup:        []groupCount{{GroupID: 2, GroupName: "", Count: 2}},
				ByPlatformType: platformCounts{Docker: 2},
				ByHealth:       healthCounts{Up: 2},
			},
		},
		{
			name: "mix of up and down docker endpoints",
			endpoints: []testEndpoint{
				{endpointType: portainer.DockerEnvironment, status: portainer.EndpointStatusUp, groupID: 2, agentVersion: currentVersion},
				{endpointType: portainer.DockerEnvironment, status: portainer.EndpointStatusDown, groupID: 2, agentVersion: currentVersion},
				{endpointType: portainer.DockerEnvironment, status: portainer.EndpointStatusDown, groupID: 2, agentVersion: currentVersion},
			},
			expectedCounts: EnvironmentSummaryCountsResponse{
				Total: 3, Up: 1, Down: 2, Outdated: 0, Unassigned: 0,
				ByGroup:        []groupCount{{GroupID: 2, GroupName: "", Count: 3}},
				ByPlatformType: platformCounts{Docker: 3},
				ByHealth:       healthCounts{Down: 2, Up: 1},
			},
		},
		{
			name: "unassigned endpoints have groupID 1",
			endpoints: []testEndpoint{
				{endpointType: portainer.DockerEnvironment, status: portainer.EndpointStatusUp, groupID: 1, agentVersion: currentVersion},
				{endpointType: portainer.DockerEnvironment, status: portainer.EndpointStatusUp, groupID: 2, agentVersion: currentVersion},
			},
			expectedCounts: EnvironmentSummaryCountsResponse{
				Total: 2, Up: 2, Down: 0, Outdated: 0, Unassigned: 1,
				// GroupID 1 is the default "Unassigned" group; GroupID 2 has no match.
				ByGroup:        []groupCount{{GroupID: 1, GroupName: "Unassigned", Count: 1}, {GroupID: 2, GroupName: "", Count: 1}},
				ByPlatformType: platformCounts{Docker: 2},
				ByHealth:       healthCounts{Up: 2},
			},
		},
		{
			name: "mixed scenario with docker and kubernetes types",
			endpoints: []testEndpoint{
				{endpointType: portainer.DockerEnvironment, status: portainer.EndpointStatusUp, groupID: 2, agentVersion: currentVersion},
				{endpointType: portainer.DockerEnvironment, status: portainer.EndpointStatusDown, groupID: 1, agentVersion: currentVersion},
				{endpointType: portainer.KubernetesLocalEnvironment, status: portainer.EndpointStatusUp, groupID: 1, agentVersion: currentVersion},
				{endpointType: portainer.AgentOnKubernetesEnvironment, status: portainer.EndpointStatusDown, groupID: 2, agentVersion: currentVersion},
			},
			expectedCounts: EnvironmentSummaryCountsResponse{
				Total: 4, Up: 2, Down: 2, Outdated: 0, Unassigned: 2,
				ByGroup:        []groupCount{{GroupID: 1, GroupName: "Unassigned", Count: 2}, {GroupID: 2, GroupName: "", Count: 2}},
				ByPlatformType: platformCounts{Docker: 2, Kubernetes: 2},
				ByHealth:       healthCounts{Down: 2, Up: 2},
			},
		},
		{
			name: "outdated endpoints count in both their connection bucket and Outdated",
			endpoints: []testEndpoint{
				{endpointType: portainer.AgentOnDockerEnvironment, status: portainer.EndpointStatusUp, groupID: 2, agentVersion: "2.0.0"},
				{endpointType: portainer.AgentOnDockerEnvironment, status: portainer.EndpointStatusDown, groupID: 2, agentVersion: "2.0.0"},
				{endpointType: portainer.AgentOnDockerEnvironment, status: portainer.EndpointStatusUp, groupID: 2, agentVersion: currentVersion},
			},
			expectedCounts: EnvironmentSummaryCountsResponse{
				Total: 3, Up: 2, Down: 1, Outdated: 2, Unassigned: 0,
				ByGroup:        []groupCount{{GroupID: 2, GroupName: "", Count: 3}},
				ByPlatformType: platformCounts{Docker: 3},
				ByHealth:       healthCounts{Outdated: 2, Up: 2, Down: 1},
			},
		},
		{
			name: "azure and podman endpoints counted in platform breakdown",
			endpoints: []testEndpoint{
				{endpointType: portainer.AzureEnvironment, status: portainer.EndpointStatusUp, groupID: 2, agentVersion: currentVersion},
				{endpointType: portainer.DockerEnvironment, status: portainer.EndpointStatusUp, groupID: 2, agentVersion: currentVersion, containerEngine: portainer.ContainerEnginePodman},
			},
			expectedCounts: EnvironmentSummaryCountsResponse{
				Total: 2, Up: 2, Down: 0, Outdated: 0, Unassigned: 0,
				ByGroup:        []groupCount{{GroupID: 2, GroupName: "", Count: 2}},
				ByPlatformType: platformCounts{Azure: 1, Podman: 1},
				ByHealth:       healthCounts{Up: 2},
			},
		},
		{
			name: "untrusted edge endpoints are excluded from counts",
			endpoints: []testEndpoint{
				{endpointType: portainer.DockerEnvironment, status: portainer.EndpointStatusUp, groupID: 2, agentVersion: currentVersion},
				{endpointType: portainer.EdgeAgentOnDockerEnvironment, status: portainer.EndpointStatusUp, groupID: 2, agentVersion: currentVersion, userTrusted: false},
			},
			expectedCounts: EnvironmentSummaryCountsResponse{
				Total: 1, Up: 1, Down: 0, Outdated: 0, Unassigned: 0,
				ByGroup:        []groupCount{{GroupID: 2, GroupName: "", Count: 1}},
				ByPlatformType: platformCounts{Docker: 1},
				ByHealth:       healthCounts{Up: 1},
			},
		},
		{
			name: "trusted edge endpoints classified by heartbeat, not stored status",
			endpoints: []testEndpoint{
				// Recent check-in: heartbeat alive → counted as Up + Heartbeat.
				{endpointType: portainer.EdgeAgentOnDockerEnvironment, status: portainer.EndpointStatusUp, groupID: 2, agentVersion: currentVersion, userTrusted: true, lastCheckInDate: time.Now().Unix()},
				// Stored Up but never checked in: counted as Down.
				{endpointType: portainer.EdgeAgentOnDockerEnvironment, status: portainer.EndpointStatusUp, groupID: 2, agentVersion: currentVersion, userTrusted: true, lastCheckInDate: 0},
			},
			expectedCounts: EnvironmentSummaryCountsResponse{
				Total: 2, Up: 1, Down: 1, Outdated: 0, Unassigned: 0,
				ByGroup:        []groupCount{{GroupID: 2, GroupName: "", Count: 2}},
				ByPlatformType: platformCounts{Docker: 2},
				ByHealth:       healthCounts{Up: 1, Down: 1, Heartbeat: 1},
			},
		},
		{
			name: "edge endpoint with unknown version and no check-in is not outdated",
			endpoints: []testEndpoint{
				{endpointType: portainer.EdgeAgentOnDockerEnvironment, status: portainer.EndpointStatusDown, groupID: 2, agentVersion: "", userTrusted: true, lastCheckInDate: 0},
			},
			expectedCounts: EnvironmentSummaryCountsResponse{
				Total: 1, Up: 0, Down: 1, Outdated: 0, Unassigned: 0,
				ByGroup:        []groupCount{{GroupID: 2, GroupName: "", Count: 1}},
				ByPlatformType: platformCounts{Docker: 1},
				ByHealth:       healthCounts{Down: 1},
			},
		},
		{
			name: "edge endpoint with unknown version but prior check-in is outdated",
			endpoints: []testEndpoint{
				{endpointType: portainer.EdgeAgentOnDockerEnvironment, status: portainer.EndpointStatusDown, groupID: 2, agentVersion: "", userTrusted: true, lastCheckInDate: time.Now().Add(-1 * time.Hour).Unix()},
			},
			expectedCounts: EnvironmentSummaryCountsResponse{
				Total: 1, Up: 0, Down: 1, Outdated: 1, Unassigned: 0,
				ByGroup:        []groupCount{{GroupID: 2, GroupName: "", Count: 1}},
				ByPlatformType: platformCounts{Docker: 1},
				ByHealth:       healthCounts{Down: 1, Outdated: 1},
			},
		},
		{
			name:      "no endpoints returns all zeros",
			endpoints: []testEndpoint{},
			expectedCounts: EnvironmentSummaryCountsResponse{
				Total: 0, Up: 0, Down: 0, Outdated: 0, Unassigned: 0,
				ByGroup:        []groupCount{},
				ByPlatformType: platformCounts{},
				ByHealth:       healthCounts{},
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			_, store := datastore.MustNewTestStore(t, true, true)

			for i, ep := range tt.endpoints {
				endpoint := &portainer.Endpoint{
					ID:              portainer.EndpointID(i + 1),
					Name:            "env",
					Type:            ep.endpointType,
					Status:          ep.status,
					GroupID:         ep.groupID,
					ContainerEngine: ep.containerEngine,
					UserTrusted:     ep.userTrusted,
					LastCheckInDate: ep.lastCheckInDate,
				}
				endpoint.Agent.Version = ep.agentVersion

				err := store.Endpoint().Create(endpoint)
				require.NoError(t, err)
			}

			err := store.User().Create(&portainer.User{Username: "admin", Role: portainer.AdministratorRole})
			require.NoError(t, err)

			bouncer := testhelpers.NewTestRequestBouncer()
			handler := NewHandler(bouncer)
			handler.DataStore = store

			req := httptest.NewRequest(http.MethodGet, "/endpoints/summary", nil)
			ctx := security.StoreTokenData(req, &portainer.TokenData{ID: 1, Username: "admin", Role: 1})
			req = req.WithContext(ctx)
			restrictedCtx := security.StoreRestrictedRequestContext(req, &security.RestrictedRequestContext{UserID: 1, IsAdmin: true})
			req = req.WithContext(restrictedCtx)
			testhelpers.AddTestSecurityCookie(req, "Bearer dummytoken")

			rr := httptest.NewRecorder()
			handler.ServeHTTP(rr, req)

			require.Equal(t, http.StatusOK, rr.Code, "expected 200 OK")

			body, err := io.ReadAll(rr.Body)
			require.NoError(t, err)

			var counts EnvironmentSummaryCountsResponse
			err = json.Unmarshal(body, &counts)
			require.NoError(t, err)

			assert.Equal(t, tt.expectedCounts.Total, counts.Total, "Total")
			assert.Equal(t, tt.expectedCounts.Up, counts.Up, "Up")
			assert.Equal(t, tt.expectedCounts.Down, counts.Down, "Down")
			assert.Equal(t, tt.expectedCounts.Outdated, counts.Outdated, "Outdated")
			assert.Equal(t, tt.expectedCounts.Unassigned, counts.Unassigned, "Unassigned")
			assert.Equal(t, tt.expectedCounts.ByPlatformType, counts.ByPlatformType, "ByPlatformType")
			assert.Equal(t, tt.expectedCounts.ByHealth, counts.ByHealth, "ByHealth")
			// ByGroup is derived from map iteration so order is non-deterministic.
			assert.ElementsMatch(t, tt.expectedCounts.ByGroup, counts.ByGroup, "ByGroup")
		})
	}
}

func TestResolveEndpointStatus(t *testing.T) {
	settings := &portainer.Settings{EdgeAgentCheckinInterval: 60}

	tests := []struct {
		name           string
		endpoint       *portainer.Endpoint
		expectedStatus int
	}{
		{
			name: "non-edge endpoint returns stored up status",
			endpoint: &portainer.Endpoint{
				Type:   portainer.DockerEnvironment,
				Status: portainer.EndpointStatusUp,
			},
			expectedStatus: statusUp,
		},
		{
			name: "non-edge endpoint returns stored down status",
			endpoint: &portainer.Endpoint{
				Type:   portainer.DockerEnvironment,
				Status: portainer.EndpointStatusDown,
			},
			expectedStatus: statusDown,
		},
		{
			name: "edge endpoint with recent check-in returns heartbeat",
			endpoint: &portainer.Endpoint{
				Type:            portainer.EdgeAgentOnDockerEnvironment,
				Status:          portainer.EndpointStatusUp,
				LastCheckInDate: time.Now().Unix(),
			},
			expectedStatus: statusHeartbeat,
		},
		{
			name: "edge endpoint with stale check-in returns down regardless of stored status",
			endpoint: &portainer.Endpoint{
				Type:            portainer.EdgeAgentOnDockerEnvironment,
				Status:          portainer.EndpointStatusUp,
				LastCheckInDate: 0,
			},
			expectedStatus: statusDown,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			assert.Equal(t, tt.expectedStatus, resolveEndpointStatus(tt.endpoint, settings))
		})
	}
}

func TestIsOutdated(t *testing.T) {
	currentVersion := portainer.APIVersion
	tests := []struct {
		name            string
		version         string
		lastCheckInDate int64
		expected        bool
	}{
		{name: "empty version with prior check-in is outdated (old agent style)", version: "", lastCheckInDate: time.Now().Unix(), expected: true},
		{name: "empty version with no check-in is not outdated (never connected)", version: "", lastCheckInDate: 0, expected: false},
		{name: "old version is outdated", version: "2.0.0", expected: true},
		{name: "v-prefixed old version is outdated", version: "v2.0.0", expected: true},
		{name: "current version is not outdated", version: currentVersion, expected: false},
		{name: "v-prefixed current version is not outdated", version: "v" + currentVersion, expected: false},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Empty-version logic only applies to edge endpoints; use EdgeAgentOnDocker for those cases.
			epType := portainer.AgentOnDockerEnvironment
			if tt.version == "" {
				epType = portainer.EdgeAgentOnDockerEnvironment
			}
			ep := &portainer.Endpoint{Type: epType, LastCheckInDate: tt.lastCheckInDate}
			ep.Agent.Version = tt.version
			assert.Equal(t, tt.expected, isOutdated(ep))
		})
	}
}

func TestParseGroupCounts(t *testing.T) {
	groups := []portainer.EndpointGroup{
		{ID: 1, Name: "Unassigned"},
		{ID: 3, Name: "Production"},
		{ID: 2, Name: "Staging"},
	}

	tests := []struct {
		name     string
		counts   map[portainer.EndpointGroupID]int
		expected []groupCount
	}{
		{
			name:     "empty counts returns empty slice",
			counts:   map[portainer.EndpointGroupID]int{},
			expected: []groupCount{},
		},
		{
			name: "results are sorted by GroupID ascending",
			counts: map[portainer.EndpointGroupID]int{
				3: 5,
				1: 2,
				2: 8,
			},
			expected: []groupCount{
				{GroupID: 1, GroupName: "Unassigned", Count: 2},
				{GroupID: 2, GroupName: "Staging", Count: 8},
				{GroupID: 3, GroupName: "Production", Count: 5},
			},
		},
		{
			name: "group with no matching name gets empty string",
			counts: map[portainer.EndpointGroupID]int{
				99: 1,
			},
			expected: []groupCount{
				{GroupID: 99, GroupName: "", Count: 1},
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := parseGroupCounts(tt.counts, groups)
			assert.Equal(t, tt.expected, got)
		})
	}
}

func TestCanonicalizeSemver(t *testing.T) {
	assert.Equal(t, "v2.0.0", canonicalizeSemver("2.0.0"))
	assert.Equal(t, "v2.0.0", canonicalizeSemver("v2.0.0"))
	assert.Empty(t, canonicalizeSemver(""))
	assert.Empty(t, canonicalizeSemver("  "))
}
