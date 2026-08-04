package workflows

import (
	"errors"
	"testing"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	"github.com/portainer/portainer/api/datastore"

	"github.com/stretchr/testify/require"
)

func TestDeleteIfSingleArtifact_ZeroWorkflowIDIsNoop(t *testing.T) {
	t.Parallel()
	_, store := datastore.MustNewTestStore(t, false, true)

	err := DeleteIfSingleArtifact(store, 0)
	require.NoError(t, err)
}

func TestDeleteIfSingleArtifact_NotFoundIsNoop(t *testing.T) {
	t.Parallel()
	_, store := datastore.MustNewTestStore(t, false, true)

	err := DeleteIfSingleArtifact(store, 999)
	require.NoError(t, err)
}

func TestDeleteIfSingleArtifact_MultipleArtifactsAreKept(t *testing.T) {
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

	err := DeleteIfSingleArtifact(store, wf.ID)
	require.NoError(t, err)

	_, err = store.Workflow().Read(wf.ID)
	require.NoError(t, err)
}

// TestDeleteIfSingleArtifact_ReadErrorPropagates covers the branch where the Workflow lookup
// fails for a reason other than not-found (e.g. a corrupt record); that error must still
// surface to the caller instead of being swallowed alongside the not-found case.
func TestDeleteIfSingleArtifact_ReadErrorPropagates(t *testing.T) {
	t.Parallel()
	wantErr := errors.New("boom")
	store := erroringWorkflowStore{err: wantErr}

	err := DeleteIfSingleArtifact(store, 1)
	require.ErrorIs(t, err, wantErr)
}

func TestDeleteIfSingleArtifact_SingleArtifactIsDeleted(t *testing.T) {
	t.Parallel()
	_, store := datastore.MustNewTestStore(t, false, true)

	wf := &portainer.Workflow{
		Name:      "single-artifact",
		Artifacts: []portainer.Artifact{{StackID: 1}},
	}
	require.NoError(t, store.Workflow().Create(wf))

	err := DeleteIfSingleArtifact(store, wf.ID)
	require.NoError(t, err)

	_, err = store.Workflow().Read(wf.ID)
	require.Error(t, err)
}

// erroringWorkflowStore is a workflowDeleteStore whose Workflow().Read always fails with a
// non-not-found error, to exercise the error-propagation branch of DeleteIfSingleArtifact.
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
