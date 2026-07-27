package workflows

import (
	"testing"

	portainer "github.com/portainer/portainer/api"
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
