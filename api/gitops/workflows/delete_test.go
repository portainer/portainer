package workflows

import (
	"errors"
	"testing"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	"github.com/portainer/portainer/api/datastore"

	"github.com/stretchr/testify/require"
)

func TestDetachStackArtifact_ZeroWorkflowIDIsNoop(t *testing.T) {
	t.Parallel()
	_, store := datastore.MustNewTestStore(t, false, true)

	err := DetachStackArtifact(store, 0, 1)
	require.NoError(t, err)
}

func TestDetachStackArtifact_NotFoundIsNoop(t *testing.T) {
	t.Parallel()
	_, store := datastore.MustNewTestStore(t, false, true)

	err := DetachStackArtifact(store, 999, 1)
	require.NoError(t, err)
}

func TestDetachStackArtifact_MultipleArtifactsPrunesOnlyMatched(t *testing.T) {
	t.Parallel()
	_, store := datastore.MustNewTestStore(t, false, true)

	wf := &portainer.Workflow{
		Name: "multi-artifact",
		Artifacts: []portainer.Artifact{
			{StackID: 1},
			{StackID: 2},
		},
	}
	require.NoError(t, store.Workflow().Create(wf))

	err := DetachStackArtifact(store, wf.ID, 1)
	require.NoError(t, err)

	updated, err := store.Workflow().Read(wf.ID)
	require.NoError(t, err)
	require.Len(t, updated.Artifacts, 1)
	require.Equal(t, portainer.StackID(2), updated.Artifacts[0].StackID)
}

// TestDetachStackArtifact_ReadErrorPropagates covers the branch where the Workflow lookup
// fails for a reason other than not-found (e.g. a corrupt record); that error must still
// surface to the caller instead of being swallowed alongside the not-found case.
func TestDetachStackArtifact_ReadErrorPropagates(t *testing.T) {
	t.Parallel()
	wantErr := errors.New("boom")
	store := erroringWorkflowStore{err: wantErr}

	err := DetachStackArtifact(store, 1, 1)
	require.ErrorIs(t, err, wantErr)
}

func TestDetachStackArtifact_SingleArtifactDeletesWorkflow(t *testing.T) {
	t.Parallel()
	_, store := datastore.MustNewTestStore(t, false, true)

	wf := &portainer.Workflow{
		Name:      "single-artifact",
		Artifacts: []portainer.Artifact{{StackID: 1}},
	}
	require.NoError(t, store.Workflow().Create(wf))

	err := DetachStackArtifact(store, wf.ID, 1)
	require.NoError(t, err)

	_, err = store.Workflow().Read(wf.ID)
	require.Error(t, err)
}

func TestDetachStackArtifact_NoMatchLeavesWorkflowUnchanged(t *testing.T) {
	t.Parallel()
	_, store := datastore.MustNewTestStore(t, false, true)

	wf := &portainer.Workflow{
		Name:      "no-match",
		Artifacts: []portainer.Artifact{{StackID: 1}},
	}
	require.NoError(t, store.Workflow().Create(wf))

	err := DetachStackArtifact(store, wf.ID, 999)
	require.NoError(t, err)

	updated, err := store.Workflow().Read(wf.ID)
	require.NoError(t, err)
	require.Len(t, updated.Artifacts, 1)
}

func TestDetachEdgeStackArtifact_MultipleArtifactsPrunesOnlyMatched(t *testing.T) {
	t.Parallel()
	_, store := datastore.MustNewTestStore(t, false, true)

	wf := &portainer.Workflow{
		Name: "multi-edge-artifact",
		Artifacts: []portainer.Artifact{
			{EdgeStackID: 1},
			{EdgeStackID: 2},
		},
	}
	require.NoError(t, store.Workflow().Create(wf))

	err := DetachEdgeStackArtifact(store, wf.ID, 1)
	require.NoError(t, err)

	updated, err := store.Workflow().Read(wf.ID)
	require.NoError(t, err)
	require.Len(t, updated.Artifacts, 1)
	require.Equal(t, portainer.EdgeStackID(2), updated.Artifacts[0].EdgeStackID)
}

func TestDetachEdgeStackArtifact_SingleArtifactDeletesWorkflow(t *testing.T) {
	t.Parallel()
	_, store := datastore.MustNewTestStore(t, false, true)

	wf := &portainer.Workflow{
		Name:      "single-edge-artifact",
		Artifacts: []portainer.Artifact{{EdgeStackID: 1}},
	}
	require.NoError(t, store.Workflow().Create(wf))

	err := DetachEdgeStackArtifact(store, wf.ID, 1)
	require.NoError(t, err)

	_, err = store.Workflow().Read(wf.ID)
	require.Error(t, err)
}

// erroringWorkflowStore is a workflowDeleteStore whose Workflow().Read always fails with a
// non-not-found error, to exercise the error-propagation branch of detachArtifact.
type erroringWorkflowStore struct {
	err error
}

func (s erroringWorkflowStore) Workflow() dataservices.WorkflowService {
	return erroringWorkflowService{err: s.err}
}

type erroringWorkflowService struct {
	dataservices.WorkflowService
	err error
}

func (s erroringWorkflowService) Read(portainer.WorkflowID) (*portainer.Workflow, error) {
	return nil, s.err
}
