package edgestacks

import (
	"os"
	"testing"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	"github.com/portainer/portainer/api/datastore"
	"github.com/portainer/portainer/api/filesystem"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestDeleteRecords_RemovesRecordsButLeavesFiles(t *testing.T) {
	t.Parallel()
	svc, store, fs := newDeleteService(t)

	edgeStack := &portainer.EdgeStack{ID: 1, Name: "stack"}
	require.NoError(t, store.EdgeStack().Create(edgeStack.ID, edgeStack))
	require.NoError(t, store.EdgeStackStatus().Create(edgeStack.ID, 1, &portainer.EdgeStackStatusForEnv{EndpointID: 1}))

	projectPath := fs.GetEdgeStackProjectPath("1")
	require.NoError(t, os.MkdirAll(projectPath, 0o755))

	err := store.UpdateTx(func(tx dataservices.DataStoreTx) error {
		return svc.DeleteRecords(tx, edgeStack)
	})
	require.NoError(t, err)

	_, err = store.EdgeStack().EdgeStack(edgeStack.ID)
	assert.True(t, store.IsErrObjectNotFound(err))

	statuses, err := store.EdgeStackStatus().ReadAll(edgeStack.ID)
	require.NoError(t, err)
	assert.Empty(t, statuses)

	assert.DirExists(t, projectPath, "project files must be left in place")

	require.NoError(t, svc.CleanupAfterDelete(edgeStack.ID))
	assert.NoDirExists(t, projectPath)
}

func newDeleteService(t *testing.T) (*Service, *datastore.Store, portainer.FileService) {
	t.Helper()

	_, store := datastore.MustNewTestStore(t, true, false)

	fs, err := filesystem.NewService(t.TempDir(), "")
	require.NoError(t, err)

	return NewService(store, fs), store, fs
}
