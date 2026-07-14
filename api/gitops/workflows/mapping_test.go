package workflows

import (
	"testing"

	portainer "github.com/portainer/portainer/api"
	gittypes "github.com/portainer/portainer/api/git/types"

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

func TestMapEdgeStackToSourceWorkflow_DockerPlatform(t *testing.T) {
	t.Parallel()

	es := portainer.EdgeStack{
		ID:             1,
		Name:           "docker-edge",
		DeploymentType: portainer.EdgeStackDeploymentCompose,
		EdgeGroups:     []portainer.EdgeGroupID{1},
		CreationDate:   1587399600,
	}
	cfg := &gittypes.RepoConfig{URL: "https://github.com/x/repo"}

	w := MapEdgeStackToSourceWorkflow(2, es, 7, cfg, nil, map[portainer.EdgeGroupID][]portainer.EndpointID{1: {10}}, WorkflowPhaseStatus{Status: StatusHealthy}, WorkflowPhaseStatus{Status: StatusHealthy})

	require.Equal(t, portainer.WorkflowID(2), w.ID)
	require.Equal(t, es.Name, w.Name)
	require.Equal(t, TypeEdgeStack, w.Type)
	require.Equal(t, DeploymentPlatformDockerStandalone, w.Platform)
	require.Equal(t, es.CreationDate, w.CreationDate)
	require.Equal(t, cfg, w.GitConfig)
	require.Equal(t, portainer.SourceID(7), w.SourceID)
	require.Equal(t, []portainer.EdgeGroupID{1}, w.Target.EdgeGroupIDs)
}

func TestMapEdgeStackToSourceWorkflow_KubernetesPlatform(t *testing.T) {
	t.Parallel()

	es := portainer.EdgeStack{
		ID:             2,
		Name:           "kube-edge",
		DeploymentType: portainer.EdgeStackDeploymentKubernetes,
		EdgeGroups:     []portainer.EdgeGroupID{1},
	}

	w := MapEdgeStackToSourceWorkflow(1, es, 0, nil, nil, map[portainer.EdgeGroupID][]portainer.EndpointID{}, WorkflowPhaseStatus{Status: StatusUnknown}, WorkflowPhaseStatus{Status: StatusUnknown})

	require.Equal(t, DeploymentPlatformKubernetes, w.Platform)
}

func TestMapEdgeStackToSourceWorkflow_GroupStatusesAndResolvedEndpoints(t *testing.T) {
	t.Parallel()

	statuses := []portainer.EdgeStackStatusForEnv{
		{EndpointID: 10, Status: []portainer.EdgeStackDeploymentStatus{{Type: portainer.EdgeStackStatusRunning}}},
		{EndpointID: 20, Status: []portainer.EdgeStackDeploymentStatus{{Type: portainer.EdgeStackStatusError, Error: "boom"}}},
	}
	groupEndpoints := map[portainer.EdgeGroupID][]portainer.EndpointID{
		1: {10},
		2: {20},
	}
	es := portainer.EdgeStack{
		ID:         3,
		Name:       "multi-group",
		EdgeGroups: []portainer.EdgeGroupID{1, 2},
	}

	w := MapEdgeStackToSourceWorkflow(5, es, 0, nil, statuses, groupEndpoints, WorkflowPhaseStatus{Status: StatusUnknown}, WorkflowPhaseStatus{Status: StatusUnknown})

	require.Equal(t, StatusHealthy, w.Target.GroupStatus[1])
	require.Equal(t, StatusError, w.Target.GroupStatus[2])
	require.Len(t, w.Target.ResolvedEndpointIDs, 2)
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
