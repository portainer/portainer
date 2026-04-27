package workflows

import (
	"testing"

	portainer "github.com/portainer/portainer/api"
	"github.com/stretchr/testify/assert"
)

func TestEffectiveStatus(t *testing.T) {
	t.Parallel()

	makeWorkflow := func(source, artifact, target Status) Workflow {
		return Workflow{
			Status: WorkflowStatusObject{
				Source:   WorkflowPhaseStatus{Status: source},
				Artifact: WorkflowPhaseStatus{Status: artifact},
				Target:   WorkflowPhaseStatus{Status: target},
			},
		}
	}

	cases := []struct {
		name string
		w    Workflow
		want Status
	}{
		{"all healthy", makeWorkflow(StatusHealthy, StatusHealthy, StatusHealthy), StatusHealthy},
		{"all unknown", makeWorkflow(StatusUnknown, StatusUnknown, StatusUnknown), StatusUnknown},
		{"source error wins over syncing target", makeWorkflow(StatusError, StatusSyncing, StatusHealthy), StatusError},
		{"artifact error wins over syncing target", makeWorkflow(StatusHealthy, StatusError, StatusSyncing), StatusError},
		{"target error wins over healthy phases", makeWorkflow(StatusHealthy, StatusHealthy, StatusError), StatusError},
		{"syncing beats paused and healthy", makeWorkflow(StatusPaused, StatusSyncing, StatusHealthy), StatusSyncing},
		{"paused beats healthy", makeWorkflow(StatusHealthy, StatusPaused, StatusHealthy), StatusPaused},
		{"healthy beats unknown", makeWorkflow(StatusUnknown, StatusHealthy, StatusUnknown), StatusHealthy},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			t.Parallel()
			assert.Equal(t, tc.want, EffectiveStatus(tc.w))
		})
	}
}

func TestCountByStatus(t *testing.T) {
	t.Parallel()

	makeW := func(s Status) Workflow {
		return Workflow{
			Status: WorkflowStatusObject{
				Source:   WorkflowPhaseStatus{Status: s},
				Artifact: WorkflowPhaseStatus{Status: s},
				Target:   WorkflowPhaseStatus{Status: s},
			},
		}
	}

	t.Run("empty list", func(t *testing.T) {
		t.Parallel()
		assert.Equal(t, StatusSummary{}, CountByStatus(nil))
	})

	t.Run("single healthy", func(t *testing.T) {
		t.Parallel()
		assert.Equal(t, StatusSummary{Healthy: 1}, CountByStatus([]Workflow{makeW(StatusHealthy)}))
	})

	t.Run("mixed statuses", func(t *testing.T) {
		t.Parallel()
		workflows := []Workflow{
			makeW(StatusHealthy),
			makeW(StatusError),
			makeW(StatusSyncing),
			makeW(StatusPaused),
			makeW(StatusUnknown),
			makeW(StatusError),
		}
		assert.Equal(t, StatusSummary{Healthy: 1, Error: 2, Syncing: 1, Paused: 1, Unknown: 1}, CountByStatus(workflows))
	})

	t.Run("error phase overrides healthy target", func(t *testing.T) {
		t.Parallel()
		w := Workflow{
			Status: WorkflowStatusObject{
				Source:   WorkflowPhaseStatus{Status: StatusError},
				Artifact: WorkflowPhaseStatus{Status: StatusUnknown},
				Target:   WorkflowPhaseStatus{Status: StatusHealthy},
			},
		}
		s := CountByStatus([]Workflow{w})
		assert.Equal(t, 1, s.Error)
		assert.Equal(t, 0, s.Healthy)
	})
}

func TestDeriveEdgeStackTargetState(t *testing.T) {
	t.Parallel()

	ep := func(id portainer.EndpointID, typ portainer.EdgeStackStatusType) portainer.EdgeStackStatusForEnv {
		return portainer.EdgeStackStatusForEnv{
			EndpointID: id,
			Status:     []portainer.EdgeStackDeploymentStatus{{Type: typ}},
		}
	}

	cases := []struct {
		name     string
		statuses []portainer.EdgeStackStatusForEnv
		want     Status
	}{
		{"empty", nil, StatusUnknown},
		{"all per-env status slices empty", []portainer.EdgeStackStatusForEnv{{EndpointID: 1}}, StatusUnknown},
		{"running → healthy", []portainer.EdgeStackStatusForEnv{ep(1, portainer.EdgeStackStatusRunning)}, StatusHealthy},
		{"deploying → syncing", []portainer.EdgeStackStatusForEnv{ep(1, portainer.EdgeStackStatusDeploying)}, StatusSyncing},
		{"paused deploying → paused", []portainer.EdgeStackStatusForEnv{ep(1, portainer.EdgeStackStatusPausedDeploying)}, StatusPaused},
		{"error short-circuits", []portainer.EdgeStackStatusForEnv{ep(1, portainer.EdgeStackStatusError)}, StatusError},
		{
			"error + running → error (short-circuit, order matters)",
			[]portainer.EdgeStackStatusForEnv{
				ep(1, portainer.EdgeStackStatusError),
				ep(2, portainer.EdgeStackStatusRunning),
			},
			StatusError,
		},
		{
			"syncing beats paused",
			[]portainer.EdgeStackStatusForEnv{
				ep(1, portainer.EdgeStackStatusPausedDeploying),
				ep(2, portainer.EdgeStackStatusDeploying),
			},
			StatusSyncing,
		},
		{
			"healthy does not downgrade syncing",
			[]portainer.EdgeStackStatusForEnv{
				ep(1, portainer.EdgeStackStatusDeploying),
				ep(2, portainer.EdgeStackStatusRunning),
			},
			StatusSyncing,
		},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			t.Parallel()
			result := deriveEdgeStackTargetState(tc.statuses)
			assert.Equal(t, tc.want, result.Status)
		})
	}
}
