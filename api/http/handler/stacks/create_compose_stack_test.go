package stacks

import (
	"errors"
	"testing"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	"github.com/portainer/portainer/api/datastore"
	"github.com/portainer/portainer/api/filesystem"
	"github.com/portainer/portainer/api/internal/testhelpers"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// TestCheckAndCleanStackDupFromSwarm_WorkflowAlreadyDeleted_StillDeletesStack covers a race where
// the duplicate stack's shared Workflow record was already removed (e.g. by a concurrent
// delete/update on another stack sharing it) before this cleanup runs. The duplicate stack must
// still be removed rather than leaving it stuck blocking stack name uniqueness checks.
func TestCheckAndCleanStackDupFromSwarm_WorkflowAlreadyDeleted_StillDeletesStack(t *testing.T) {
	t.Parallel()
	_, store := datastore.MustNewTestStore(t, true, false)
	fileService, err := filesystem.NewService(t.TempDir(), "")
	require.NoError(t, err, "error init file service")

	handler := NewHandler(testhelpers.NewTestRequestBouncer(), nil)
	handler.DataStore = store
	handler.FileService = fileService

	stack := &portainer.Stack{ID: 1, Name: "dup-stack", Type: portainer.DockerSwarmStack, WorkflowID: 999}
	require.NoError(t, store.Stack().Create(stack))

	err = handler.checkAndCleanStackDupFromSwarm(nil, nil, nil, portainer.UserID(0), stack)
	require.NoError(t, err, "cleanup should succeed even though the stack's Workflow was already gone")

	_, err = store.Stack().Read(stack.ID)
	assert.True(t, store.IsErrObjectNotFound(err), "duplicate stack should be deleted")
}

// TestCheckAndCleanStackDupFromSwarm_DetachesWorkflowAndDeletesStackAtomically covers BE-13446:
// detaching the workflow artifact and deleting the Stack record used to run as two separate
// BoltDB transactions, so a crash between them could leave the Stack alive with a WorkflowID
// pointing at an already-deleted Workflow. Both must now commit together.
func TestCheckAndCleanStackDupFromSwarm_DetachesWorkflowAndDeletesStackAtomically(t *testing.T) {
	t.Parallel()
	_, store := datastore.MustNewTestStore(t, true, false)
	fileService, err := filesystem.NewService(t.TempDir(), "")
	require.NoError(t, err, "error init file service")

	wf := &portainer.Workflow{Artifacts: []portainer.Artifact{{StackID: 1}}}
	err = store.Workflow().Create(wf)
	require.NoError(t, err)

	handler := NewHandler(testhelpers.NewTestRequestBouncer(), nil)
	handler.DataStore = store
	handler.FileService = fileService

	stack := &portainer.Stack{ID: 1, Name: "dup-stack", Type: portainer.DockerSwarmStack, WorkflowID: wf.ID}
	require.NoError(t, store.Stack().Create(stack))

	err = handler.checkAndCleanStackDupFromSwarm(nil, nil, nil, portainer.UserID(0), stack)
	require.NoError(t, err)

	_, err = store.Stack().Read(stack.ID)
	assert.True(t, store.IsErrObjectNotFound(err), "duplicate stack should be deleted")

	_, err = store.Workflow().Read(wf.ID)
	assert.True(t, store.IsErrObjectNotFound(err), "single-artifact workflow should be detached and deleted")
}

type failAfterUpdateTxDataStore struct {
	dataservices.DataStore
}

func (s failAfterUpdateTxDataStore) UpdateTx(fn func(tx dataservices.DataStoreTx) error) error {
	return s.DataStore.UpdateTx(func(tx dataservices.DataStoreTx) error {
		if err := fn(tx); err != nil {
			return err
		}

		return errors.New("injected failure after the transaction body ran")
	})
}

// If the transaction fails after the workflow detach and the stack deletion ran, both must roll back
func TestCheckAndCleanStackDupFromSwarm_TransactionFails_RollsBackWorkflowAndStack(t *testing.T) {
	t.Parallel()
	_, store := datastore.MustNewTestStore(t, true, false)
	fileService, err := filesystem.NewService(t.TempDir(), "")
	require.NoError(t, err, "error init file service")

	wf := &portainer.Workflow{Artifacts: []portainer.Artifact{{StackID: 1}}}
	err = store.Workflow().Create(wf)
	require.NoError(t, err)

	handler := NewHandler(testhelpers.NewTestRequestBouncer(), nil)
	handler.DataStore = failAfterUpdateTxDataStore{DataStore: store}
	handler.FileService = fileService

	stack := &portainer.Stack{ID: 1, Name: "dup-stack", Type: portainer.DockerSwarmStack, WorkflowID: wf.ID}
	err = store.Stack().Create(stack)
	require.NoError(t, err)

	err = handler.checkAndCleanStackDupFromSwarm(nil, nil, nil, portainer.UserID(0), stack)
	require.Error(t, err)

	_, err = store.Stack().Read(stack.ID)
	require.NoError(t, err, "stack should survive when the transaction fails")

	_, err = store.Workflow().Read(wf.ID)
	require.NoError(t, err, "workflow detach should roll back when the transaction fails")
}

func TestComposeGitPayload_ValidateWithSourceID_URLNotRequired(t *testing.T) {
	t.Parallel()
	payload := &composeStackFromGitRepositoryPayload{
		Name:     "mystack",
		SourceID: portainer.SourceID(1),
		// RepositoryURL intentionally omitted
	}

	err := payload.Validate(nil)
	assert.NoError(t, err)
}

func TestComposeGitPayload_ValidateWithoutSourceID_URLRequired(t *testing.T) {
	t.Parallel()
	payload := &composeStackFromGitRepositoryPayload{
		Name: "mystack",
		// SourceID and RepositoryURL both omitted
	}

	err := payload.Validate(nil)
	assert.Error(t, err)
}
