package teardown_test

import (
	"context"
	"errors"
	"os"
	"testing"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	"github.com/portainer/portainer/api/datastore"
	"github.com/portainer/portainer/api/filesystem"
	"github.com/portainer/portainer/api/stacks/deployments"
	"github.com/portainer/portainer/api/stacks/teardown"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestDeleteRecords_RemovesStackAndResourceControl(t *testing.T) {
	t.Parallel()
	svc, store := newService(t, &stubFileService{}, &stubSwarmStackManager{}, &stubComposeStackManager{}, &stubStackDeployer{}, &stubKubernetesDeployer{})

	stack := &portainer.Stack{ID: 1, EndpointID: 1, Type: portainer.DockerComposeStack, Name: "test-stack", ProjectPath: "/data/compose/1"}
	require.NoError(t, store.Stack().Create(stack))

	resourceControl := &portainer.ResourceControl{ResourceID: "1_test-stack", Type: portainer.StackResourceControl}
	require.NoError(t, store.ResourceControl().Create(resourceControl))

	require.NoError(t, deleteRecords(t, store, svc, stack))

	_, err := store.Stack().Read(stack.ID)
	assert.True(t, store.IsErrObjectNotFound(err))

	_, err = store.ResourceControl().Read(resourceControl.ID)
	assert.True(t, store.IsErrObjectNotFound(err))
}

// The record deletions must be atomic with the caller's other writes: if the
// surrounding transaction fails after DeleteRecords, the stack record must
// survive. This is the guarantee that lets handlers delete the stack and its
// associated workflow in a single transaction.
func TestDeleteRecords_RollsBackWithSurroundingTransaction(t *testing.T) {
	t.Parallel()
	svc, store := newService(t, &stubFileService{}, &stubSwarmStackManager{}, &stubComposeStackManager{}, &stubStackDeployer{}, &stubKubernetesDeployer{})

	stack := &portainer.Stack{ID: 1, EndpointID: 1, Type: portainer.DockerComposeStack, Name: "test-stack"}
	require.NoError(t, store.Stack().Create(stack))

	boom := errors.New("later write failed")
	err := store.UpdateTx(func(tx dataservices.DataStoreTx) error {
		if err := svc.DeleteRecords(tx, stack); err != nil {
			return err
		}

		return boom
	})
	require.ErrorIs(t, err, boom)

	_, err = store.Stack().Read(stack.ID)
	require.NoError(t, err)
}

func TestDeleteRecords_StackDeletionFails_ReturnsError(t *testing.T) {
	t.Parallel()
	svc, store := newService(t, &stubFileService{}, &stubSwarmStackManager{}, &stubComposeStackManager{}, &stubStackDeployer{}, &stubKubernetesDeployer{})

	stack := &portainer.Stack{ID: 1, EndpointID: 1, Type: portainer.DockerComposeStack, Name: "test-stack"}
	require.NoError(t, store.Stack().Create(stack))

	deleteErr := errors.New("bucket is closed")
	err := store.UpdateTx(func(tx dataservices.DataStoreTx) error {
		return svc.DeleteRecords(&failingStackDeleteTx{DataStoreTx: tx, deleteErr: deleteErr}, stack)
	})
	require.ErrorIs(t, err, deleteErr)

	_, err = store.Stack().Read(stack.ID)
	require.NoError(t, err, "stack should survive when its database deletion fails")
}

// failingStackDeleteTx wraps a real transaction but makes Stack().Delete fail,
// exercising the error path that a real boltdb Delete (idempotent on missing
// keys) can't otherwise trigger.
type failingStackDeleteTx struct {
	dataservices.DataStoreTx
	deleteErr error
}

func (tx *failingStackDeleteTx) Stack() dataservices.StackService {
	return &failingStackService{StackService: tx.DataStoreTx.Stack(), deleteErr: tx.deleteErr}
}

type failingStackService struct {
	dataservices.StackService
	deleteErr error
}

func (s *failingStackService) Delete(portainer.StackID) error {
	return s.deleteErr
}

func TestRemoveFiles_RemovesProjectDirectory(t *testing.T) {
	t.Parallel()
	fileService := &stubFileService{}
	svc, _ := newService(t, fileService, &stubSwarmStackManager{}, &stubComposeStackManager{}, &stubStackDeployer{}, &stubKubernetesDeployer{})

	require.NoError(t, svc.RemoveFiles(&portainer.Stack{ProjectPath: "/data/compose/1"}))

	assert.Equal(t, "/data/compose/1", fileService.removedPath)
}

func TestRemoveFiles_ReturnsErrorWhenRemovalFails(t *testing.T) {
	t.Parallel()
	removeErr := errors.New("permission denied")
	fileService := &stubFileService{removeErr: removeErr}
	svc, _ := newService(t, fileService, &stubSwarmStackManager{}, &stubComposeStackManager{}, &stubStackDeployer{}, &stubKubernetesDeployer{})

	err := svc.RemoveFiles(&portainer.Stack{ProjectPath: "/data/compose/1"})

	require.ErrorIs(t, err, removeErr)
}

func TestRemoveResources_SwarmStack(t *testing.T) {
	t.Parallel()
	svc, _ := newService(t, &stubFileService{}, &stubSwarmStackManager{}, &stubComposeStackManager{}, &stubStackDeployer{}, &stubKubernetesDeployer{})

	stack := &portainer.Stack{ID: 1, Type: portainer.DockerSwarmStack, Name: "test-stack"}

	require.NoError(t, svc.RemoveResources(context.Background(), 1, stack, &portainer.Endpoint{ID: 1}))
}

// kubectl delete on a manifest whose resources were already removed (e.g. a
// prior partial delete) errors out; if the manifest file is also gone from
// disk, that's treated as confirmation the stack is already torn down rather
// than a real failure.
func TestRemoveResources_KubernetesManifestAlreadyMissing_ReturnsNil(t *testing.T) {
	t.Parallel()
	removeErr := errors.New("kubectl delete failed")
	svc, _ := newService(t, &stubFileService{}, &stubSwarmStackManager{}, &stubComposeStackManager{}, &stubStackDeployer{}, &stubKubernetesDeployer{removeErr: removeErr})

	projectPath := t.TempDir()
	stack := &portainer.Stack{ID: 1, Type: portainer.KubernetesStack, Name: "test-stack", ProjectPath: projectPath, EntryPoint: "docker-compose.yml"}

	require.NoError(t, svc.RemoveResources(context.Background(), 1, stack, &portainer.Endpoint{ID: 1}))
}

func TestRemoveResources_ComposeStack(t *testing.T) {
	t.Parallel()
	deployer := &stubStackDeployer{}
	svc, _ := newService(t, &stubFileService{}, &stubSwarmStackManager{}, &stubComposeStackManager{}, deployer, &stubKubernetesDeployer{})

	stack := &portainer.Stack{ID: 1, Type: portainer.DockerComposeStack, Name: "test-stack"}

	require.NoError(t, svc.RemoveResources(context.Background(), 1, stack, &portainer.Endpoint{ID: 1}))
	assert.True(t, deployer.composeCalled)
}

func TestRemoveResources_KubernetesManifestRemovalFails_ReturnsError(t *testing.T) {
	t.Parallel()
	removeErr := errors.New("kubectl delete failed")
	svc, _ := newService(t, &stubFileService{}, &stubSwarmStackManager{}, &stubComposeStackManager{}, &stubStackDeployer{}, &stubKubernetesDeployer{removeErr: removeErr})

	projectPath := t.TempDir()
	require.NoError(t, os.WriteFile(filesystem.JoinPaths(projectPath, "docker-compose.yml"), []byte("---"), 0o644))

	stack := &portainer.Stack{ID: 1, Type: portainer.KubernetesStack, Name: "test-stack", ProjectPath: projectPath, EntryPoint: "docker-compose.yml"}

	require.Error(t, svc.RemoveResources(context.Background(), 1, stack, &portainer.Endpoint{ID: 1}))
}

func TestRemoveResources_UnsupportedStackType_ReturnsError(t *testing.T) {
	t.Parallel()
	svc, _ := newService(t, &stubFileService{}, &stubSwarmStackManager{}, &stubComposeStackManager{}, &stubStackDeployer{}, &stubKubernetesDeployer{})

	stack := &portainer.Stack{ID: 1, Type: 99, Name: "test-stack"}

	require.Error(t, svc.RemoveResources(context.Background(), 1, stack, &portainer.Endpoint{ID: 1}))
}

func TestRemoveResources_DoesNotTouchDatabaseOrFilesystem(t *testing.T) {
	t.Parallel()
	fileService := &stubFileService{}
	svc, store := newService(t, fileService, &stubSwarmStackManager{}, &stubComposeStackManager{}, &stubStackDeployer{}, &stubKubernetesDeployer{})

	// An external stack is never persisted to the database.
	stack := &portainer.Stack{Type: portainer.DockerSwarmStack, Name: "external-stack"}

	require.NoError(t, svc.RemoveResources(context.Background(), 1, stack, &portainer.Endpoint{ID: 1}))
	assert.Empty(t, fileService.removedPath)

	_, err := store.Stack().Read(stack.ID)
	assert.True(t, store.IsErrObjectNotFound(err))
}

type stubSwarmStackManager struct {
	portainer.SwarmStackManager
	removeErr error
}

func (s *stubSwarmStackManager) NormalizeStackName(name string) string { return name }

func (s *stubSwarmStackManager) Remove(_ context.Context, _ *portainer.Stack, _ *portainer.Endpoint) error {
	return s.removeErr
}

type stubComposeStackManager struct {
	portainer.ComposeStackManager
}

func (s *stubComposeStackManager) NormalizeStackName(name string) string { return name }

type stubStackDeployer struct {
	deployments.StackDeployer
	undeployErr   error
	composeCalled bool
}

func (s *stubStackDeployer) UndeployComposeStack(_ context.Context, _ *portainer.Stack, _ *portainer.Endpoint) error {
	s.composeCalled = true
	return s.undeployErr
}

type stubKubernetesDeployer struct {
	portainer.KubernetesDeployer
	removeErr error
}

func (s *stubKubernetesDeployer) Remove(_ context.Context, _ portainer.UserID, _ *portainer.Endpoint, _ []string, _ string) (string, error) {
	return "", s.removeErr
}

type stubFileService struct {
	portainer.FileService
	removedPath string
	removeErr   error
}

func (s *stubFileService) RemoveDirectory(path string) error {
	s.removedPath = path
	return s.removeErr
}

func newService(t *testing.T, fileService portainer.FileService, swarmStackManager portainer.SwarmStackManager, composeStackManager portainer.ComposeStackManager, stackDeployer deployments.StackDeployer, kubernetesDeployer portainer.KubernetesDeployer) (teardown.Service, *datastore.Store) {
	t.Helper()
	_, store := datastore.MustNewTestStore(t, true, false)

	return teardown.NewService(fileService, swarmStackManager, composeStackManager, stackDeployer, kubernetesDeployer), store
}

// deleteRecords runs the transactional record deletion the way handlers do:
// inside a write transaction.
func deleteRecords(t *testing.T, store *datastore.Store, svc teardown.Service, stack *portainer.Stack) error {
	t.Helper()
	return store.UpdateTx(func(tx dataservices.DataStoreTx) error {
		return svc.DeleteRecords(tx, stack)
	})
}
