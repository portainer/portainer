package workflows

import (
	"testing"

	portainer "github.com/portainer/portainer/api"
	"github.com/stretchr/testify/assert"
)

func TestStackLastSyncDate(t *testing.T) {
	t.Parallel()

	t.Run("no deployment status", func(t *testing.T) {
		t.Parallel()
		assert.Equal(t, int64(0), stackLastSyncDate(portainer.Stack{}))
	})

	t.Run("no active entry", func(t *testing.T) {
		t.Parallel()
		s := portainer.Stack{DeploymentStatus: []portainer.StackDeploymentStatus{
			{Status: portainer.StackStatusDeploying, Time: 100},
		}}
		assert.Equal(t, int64(0), stackLastSyncDate(s))
	})

	t.Run("last entry is active", func(t *testing.T) {
		t.Parallel()
		s := portainer.Stack{DeploymentStatus: []portainer.StackDeploymentStatus{
			{Status: portainer.StackStatusDeploying, Time: 50},
			{Status: portainer.StackStatusActive, Time: 100},
		}}
		assert.Equal(t, int64(100), stackLastSyncDate(s))
	})

	t.Run("active followed by non-active returns the active time", func(t *testing.T) {
		t.Parallel()
		s := portainer.Stack{DeploymentStatus: []portainer.StackDeploymentStatus{
			{Status: portainer.StackStatusActive, Time: 100},
			{Status: portainer.StackStatusDeploying, Time: 200},
		}}
		assert.Equal(t, int64(100), stackLastSyncDate(s))
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
