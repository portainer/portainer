package stacks

import (
	"testing"

	portainer "github.com/portainer/portainer/api"
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
