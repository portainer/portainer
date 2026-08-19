package workflows

import (
	"testing"

	portainer "github.com/portainer/portainer/api"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestStackLastSyncDate(t *testing.T) {
	t.Parallel()

	t.Run("no deployment status", func(t *testing.T) {
		t.Parallel()
		assert.Equal(t, int64(0), StackLastSyncDate(portainer.Stack{}))
	})

	t.Run("no active entry", func(t *testing.T) {
		t.Parallel()
		s := portainer.Stack{DeploymentStatus: []portainer.StackDeploymentStatus{
			{Status: portainer.StackStatusDeploying, Time: 100},
		}}
		assert.Equal(t, int64(0), StackLastSyncDate(s))
	})

	t.Run("last entry is active", func(t *testing.T) {
		t.Parallel()
		s := portainer.Stack{DeploymentStatus: []portainer.StackDeploymentStatus{
			{Status: portainer.StackStatusDeploying, Time: 50},
			{Status: portainer.StackStatusActive, Time: 100},
		}}
		assert.Equal(t, int64(100), StackLastSyncDate(s))
	})

	t.Run("active followed by non-active returns the active time", func(t *testing.T) {
		t.Parallel()
		s := portainer.Stack{DeploymentStatus: []portainer.StackDeploymentStatus{
			{Status: portainer.StackStatusActive, Time: 100},
			{Status: portainer.StackStatusDeploying, Time: 200},
		}}
		assert.Equal(t, int64(100), StackLastSyncDate(s))
	})
}

func TestEdgeStackLastSyncDate(t *testing.T) {
	t.Parallel()

	t.Run("empty statuses", func(t *testing.T) {
		t.Parallel()
		assert.Equal(t, int64(0), edgeStackLastSyncDate(nil))
	})

	t.Run("no healthy status for endpoint", func(t *testing.T) {
		t.Parallel()
		statuses := []portainer.EdgeStackStatusForEnv{
			{EndpointID: 1, Status: []portainer.EdgeStackDeploymentStatus{
				{Type: portainer.EdgeStackStatusDeploying, Time: 100},
			}},
		}
		assert.Equal(t, int64(0), edgeStackLastSyncDate(statuses))
	})

	t.Run("single endpoint with healthy status", func(t *testing.T) {
		t.Parallel()
		statuses := []portainer.EdgeStackStatusForEnv{
			{EndpointID: 1, Status: []portainer.EdgeStackDeploymentStatus{
				{Type: portainer.EdgeStackStatusRunning, Time: 200},
			}},
		}
		assert.Equal(t, int64(200), edgeStackLastSyncDate(statuses))
	})

	t.Run("returns minimum healthy time across endpoints", func(t *testing.T) {
		t.Parallel()
		statuses := []portainer.EdgeStackStatusForEnv{
			{EndpointID: 1, Status: []portainer.EdgeStackDeploymentStatus{
				{Type: portainer.EdgeStackStatusRunning, Time: 300},
			}},
			{EndpointID: 2, Status: []portainer.EdgeStackDeploymentStatus{
				{Type: portainer.EdgeStackStatusRunning, Time: 100},
			}},
		}
		assert.Equal(t, int64(100), edgeStackLastSyncDate(statuses))
	})

	t.Run("one endpoint not yet synced returns 0", func(t *testing.T) {
		t.Parallel()
		statuses := []portainer.EdgeStackStatusForEnv{
			{EndpointID: 1, Status: []portainer.EdgeStackDeploymentStatus{
				{Type: portainer.EdgeStackStatusRunning, Time: 200},
			}},
			{EndpointID: 2, Status: []portainer.EdgeStackDeploymentStatus{
				{Type: portainer.EdgeStackStatusDeploying, Time: 100},
			}},
		}
		assert.Equal(t, int64(0), edgeStackLastSyncDate(statuses))
	})
}

func TestEdgeStackTargetStatuses(t *testing.T) {
	t.Parallel()

	ep := func(id portainer.EndpointID, typ portainer.EdgeStackStatusType) portainer.EdgeStackStatusForEnv {
		return portainer.EdgeStackStatusForEnv{
			EndpointID: id,
			Status:     []portainer.EdgeStackDeploymentStatus{{Type: typ}},
		}
	}

	t.Run("group with no endpoints is unknown", func(t *testing.T) {
		t.Parallel()
		result := edgeStackTargetStatuses(
			[]portainer.EdgeGroupID{1},
			nil,
			map[portainer.EdgeGroupID][]portainer.EndpointID{1: {}},
		)
		assert.Equal(t, StatusUnknown, result[portainer.EdgeGroupID(1)])
	})

	t.Run("group inherits highest-priority endpoint status", func(t *testing.T) {
		t.Parallel()
		result := edgeStackTargetStatuses(
			[]portainer.EdgeGroupID{1},
			[]portainer.EdgeStackStatusForEnv{
				ep(1, portainer.EdgeStackStatusRunning),
				ep(2, portainer.EdgeStackStatusDeploying),
			},
			map[portainer.EdgeGroupID][]portainer.EndpointID{1: {1, 2}},
		)
		assert.Equal(t, StatusSyncing, result[portainer.EdgeGroupID(1)])
	})

	t.Run("multiple groups tracked separately", func(t *testing.T) {
		t.Parallel()
		result := edgeStackTargetStatuses(
			[]portainer.EdgeGroupID{10, 20},
			[]portainer.EdgeStackStatusForEnv{
				ep(1, portainer.EdgeStackStatusRunning),
				ep(2, portainer.EdgeStackStatusError),
			},
			map[portainer.EdgeGroupID][]portainer.EndpointID{
				10: {1},
				20: {2},
			},
		)
		assert.Equal(t, StatusHealthy, result[portainer.EdgeGroupID(10)])
		assert.Equal(t, StatusError, result[portainer.EdgeGroupID(20)])
	})
}

func TestBuildWorkflow_NameFallback(t *testing.T) {
	t.Parallel()

	t.Run("uses workflow name when set", func(t *testing.T) {
		t.Parallel()
		wf := portainer.Workflow{ID: 1, Name: "my-stack"}
		result := BuildWorkflow(wf, nil)
		require.Equal(t, "my-stack", result.Name)
	})

	t.Run("falls back to placeholder when workflow name is empty", func(t *testing.T) {
		t.Parallel()
		wf := portainer.Workflow{ID: 1}
		result := BuildWorkflow(wf, nil)
		require.Equal(t, "Unnamed workflow", result.Name)
	})
}

func TestPlatformFromStackType(t *testing.T) {
	t.Parallel()

	require.Equal(t, DeploymentPlatformKubernetes, platformFromStackType(portainer.KubernetesStack))
	require.Equal(t, DeploymentPlatformDockerSwarm, platformFromStackType(portainer.DockerSwarmStack))
	require.Equal(t, DeploymentPlatformDockerStandalone, platformFromStackType(portainer.DockerComposeStack))
	require.Equal(t, DeploymentPlatformDockerStandalone, platformFromStackType(portainer.StackType(99)))
}

func TestResolveEdgeGroupEndpoints_Empty(t *testing.T) {
	t.Parallel()

	result := resolveEdgeGroupEndpoints(nil, map[portainer.EdgeGroupID][]portainer.EndpointID{})
	require.Empty(t, result)
}

func TestResolveEdgeGroupEndpoints_DeduplicatesAcrossGroups(t *testing.T) {
	t.Parallel()

	groupEndpoints := map[portainer.EdgeGroupID][]portainer.EndpointID{
		1: {10, 20},
		2: {20, 30},
	}

	result := resolveEdgeGroupEndpoints([]portainer.EdgeGroupID{1, 2}, groupEndpoints)

	require.Len(t, result, 3)
}

func TestIsEdgeStackHealthyStatus(t *testing.T) {
	t.Parallel()

	healthyTypes := []portainer.EdgeStackStatusType{
		portainer.EdgeStackStatusRunning,
		portainer.EdgeStackStatusRolledBack,
		portainer.EdgeStackStatusCompleted,
		portainer.EdgeStackStatusRemoved,
		portainer.EdgeStackStatusRemoteUpdateSuccess,
	}
	for _, typ := range healthyTypes {
		require.True(t, isEdgeStackHealthyStatus(typ))
	}

	unhealthyTypes := []portainer.EdgeStackStatusType{
		portainer.EdgeStackStatusError,
		portainer.EdgeStackStatusDeploying,
		portainer.EdgeStackStatusPending,
	}
	for _, typ := range unhealthyTypes {
		require.False(t, isEdgeStackHealthyStatus(typ))
	}
}
