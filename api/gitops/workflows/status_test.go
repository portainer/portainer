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
		{"running: healthy", []portainer.EdgeStackStatusForEnv{ep(1, portainer.EdgeStackStatusRunning)}, StatusHealthy},
		{"deploying: syncing", []portainer.EdgeStackStatusForEnv{ep(1, portainer.EdgeStackStatusDeploying)}, StatusSyncing},
		{"paused deploying: paused", []portainer.EdgeStackStatusForEnv{ep(1, portainer.EdgeStackStatusPausedDeploying)}, StatusPaused},
		{"error short-circuits", []portainer.EdgeStackStatusForEnv{ep(1, portainer.EdgeStackStatusError)}, StatusError},
		{
			"error + running gives error (short-circuit, order matters)",
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

func TestArtifactPhases(t *testing.T) {
	t.Parallel()

	src := func(id portainer.SourceID, status portainer.SourceStatus, statusError string) portainer.Source {
		return portainer.Source{ID: id, Status: status, StatusError: statusError}
	}

	file := func(sourceID portainer.SourceID, refStatus portainer.SourceStatus, refError string, pathStatus portainer.SourceStatus, pathError string) portainer.ArtifactFile {
		return portainer.ArtifactFile{SourceID: sourceID, RefStatus: refStatus, RefError: refError, PathStatus: pathStatus, PathError: pathError}
	}

	cases := []struct {
		name         string
		files        []portainer.ArtifactFile
		sourceMap    map[portainer.SourceID]portainer.Source
		wantSource   WorkflowPhaseStatus
		wantArtifact WorkflowPhaseStatus
	}{
		{
			name:         "no files",
			files:        nil,
			sourceMap:    map[portainer.SourceID]portainer.Source{},
			wantSource:   WorkflowPhaseStatus{Status: StatusUnknown},
			wantArtifact: WorkflowPhaseStatus{Status: StatusUnknown},
		},
		{
			name:  "file's source missing from sourceMap is skipped",
			files: []portainer.ArtifactFile{file(1, portainer.SourceStatusError, "unreachable", portainer.SourceStatusError, "not found")},
			sourceMap: map[portainer.SourceID]portainer.Source{
				2: src(2, portainer.SourceStatusHealthy, ""),
			},
			wantSource:   WorkflowPhaseStatus{Status: StatusUnknown},
			wantArtifact: WorkflowPhaseStatus{Status: StatusUnknown},
		},
		{
			name:  "all healthy",
			files: []portainer.ArtifactFile{file(1, portainer.SourceStatusHealthy, "", portainer.SourceStatusHealthy, "")},
			sourceMap: map[portainer.SourceID]portainer.Source{
				1: src(1, portainer.SourceStatusHealthy, ""),
			},
			wantSource:   WorkflowPhaseStatus{Status: StatusHealthy},
			wantArtifact: WorkflowPhaseStatus{Status: StatusHealthy},
		},
		{
			name:  "source-level error dominates a healthy ref",
			files: []portainer.ArtifactFile{file(1, portainer.SourceStatusHealthy, "", portainer.SourceStatusHealthy, "")},
			sourceMap: map[portainer.SourceID]portainer.Source{
				1: src(1, portainer.SourceStatusError, "connection refused"),
			},
			wantSource:   WorkflowPhaseStatus{Status: StatusError, Error: "connection refused"},
			wantArtifact: WorkflowPhaseStatus{Status: StatusHealthy},
		},
		{
			name:  "file-level ref error dominates a healthy source",
			files: []portainer.ArtifactFile{file(1, portainer.SourceStatusError, "ref not found", portainer.SourceStatusHealthy, "")},
			sourceMap: map[portainer.SourceID]portainer.Source{
				1: src(1, portainer.SourceStatusHealthy, ""),
			},
			wantSource:   WorkflowPhaseStatus{Status: StatusError, Error: "ref not found"},
			wantArtifact: WorkflowPhaseStatus{Status: StatusHealthy},
		},
		{
			name:  "path error is independent of a broken source",
			files: []portainer.ArtifactFile{file(1, portainer.SourceStatusHealthy, "", portainer.SourceStatusHealthy, "")},
			sourceMap: map[portainer.SourceID]portainer.Source{
				1: src(1, portainer.SourceStatusError, "connection refused"),
			},
			wantSource:   WorkflowPhaseStatus{Status: StatusError, Error: "connection refused"},
			wantArtifact: WorkflowPhaseStatus{Status: StatusHealthy},
		},
		{
			name:  "path error surfaces on its own",
			files: []portainer.ArtifactFile{file(1, portainer.SourceStatusHealthy, "", portainer.SourceStatusError, "path not found")},
			sourceMap: map[portainer.SourceID]portainer.Source{
				1: src(1, portainer.SourceStatusHealthy, ""),
			},
			wantSource:   WorkflowPhaseStatus{Status: StatusHealthy},
			wantArtifact: WorkflowPhaseStatus{Status: StatusError, Error: "path not found"},
		},
		{
			name:  "tie between source and ref error keeps the source-level message",
			files: []portainer.ArtifactFile{file(1, portainer.SourceStatusError, "ref not found", portainer.SourceStatusHealthy, "")},
			sourceMap: map[portainer.SourceID]portainer.Source{
				1: src(1, portainer.SourceStatusError, "connection refused"),
			},
			wantSource:   WorkflowPhaseStatus{Status: StatusError, Error: "connection refused"},
			wantArtifact: WorkflowPhaseStatus{Status: StatusHealthy},
		},
		{
			name: "worst artifact phase wins across multiple files",
			files: []portainer.ArtifactFile{
				file(1, portainer.SourceStatusHealthy, "", portainer.SourceStatusHealthy, ""),
				file(2, portainer.SourceStatusHealthy, "", portainer.SourceStatusError, "path not found"),
			},
			sourceMap: map[portainer.SourceID]portainer.Source{
				1: src(1, portainer.SourceStatusHealthy, ""),
				2: src(2, portainer.SourceStatusHealthy, ""),
			},
			wantSource:   WorkflowPhaseStatus{Status: StatusHealthy},
			wantArtifact: WorkflowPhaseStatus{Status: StatusError, Error: "path not found"},
		},
		{
			name: "worst source phase wins across multiple files",
			files: []portainer.ArtifactFile{
				file(1, portainer.SourceStatusHealthy, "", portainer.SourceStatusHealthy, ""),
				file(2, portainer.SourceStatusError, "ref not found", portainer.SourceStatusHealthy, ""),
			},
			sourceMap: map[portainer.SourceID]portainer.Source{
				1: src(1, portainer.SourceStatusHealthy, ""),
				2: src(2, portainer.SourceStatusHealthy, ""),
			},
			wantSource:   WorkflowPhaseStatus{Status: StatusError, Error: "ref not found"},
			wantArtifact: WorkflowPhaseStatus{Status: StatusHealthy},
		},
		{
			name: "mixed accessible and inaccessible files: only the accessible one drives the result",
			files: []portainer.ArtifactFile{
				file(1, portainer.SourceStatusError, "should be ignored", portainer.SourceStatusError, "should be ignored"),
				file(2, portainer.SourceStatusHealthy, "", portainer.SourceStatusHealthy, ""),
			},
			sourceMap: map[portainer.SourceID]portainer.Source{
				2: src(2, portainer.SourceStatusHealthy, ""),
			},
			wantSource:   WorkflowPhaseStatus{Status: StatusHealthy},
			wantArtifact: WorkflowPhaseStatus{Status: StatusHealthy},
		},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			t.Parallel()
			gotSource, gotArtifact := ArtifactPhases(tc.files, tc.sourceMap)
			assert.Equal(t, tc.wantSource, gotSource)
			assert.Equal(t, tc.wantArtifact, gotArtifact)
		})
	}
}
