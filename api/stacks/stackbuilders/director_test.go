package stackbuilders

import (
	"context"
	"errors"
	"net/http"
	"sync/atomic"
	"testing"
	"time"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/datastore"
	httperrors "github.com/portainer/portainer/api/http/errors"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// Stubs

type stubBuilder struct {
	store      *datastore.Store
	savedStack *portainer.Stack
	saveErr    error
	deployErr  error
	hookCalled atomic.Bool
}

func (s *stubBuilder) setGeneralInfo(_ *portainer.Endpoint) {
	if s.savedStack == nil {
		return
	}

	now := time.Now().Unix()
	s.savedStack.Status = portainer.StackStatusDeploying
	s.savedStack.DeploymentStatus = []portainer.StackDeploymentStatus{
		{Status: portainer.StackStatusDeploying, Time: now},
	}
}

func (s *stubBuilder) prepare(_ context.Context, _ *StackPayload, _ portainer.UserID) error {
	return nil
}

func (s *stubBuilder) saveStack() (*portainer.Stack, error) {
	if s.saveErr != nil {
		return nil, s.saveErr
	}

	return s.savedStack, s.store.Stack().Create(s.savedStack)
}

func (s *stubBuilder) deploy(_ context.Context, _ *portainer.Endpoint) error {
	return s.deployErr
}

func (s *stubBuilder) postDeploy(_ context.Context, _ *portainer.Stack) error {
	s.hookCalled.Store(true)

	return nil
}

func (s *stubBuilder) cleanUp() error {
	return nil
}

// Helpers

func waitForStackStatus(t *testing.T, store *datastore.Store, id portainer.StackID, wantStatus portainer.StackStatus) *portainer.Stack {
	t.Helper()

	var stack *portainer.Stack

	require.Eventually(t, func() bool {
		var err error
		stack, err = store.Stack().Read(id)

		return err == nil && stack.Status == wantStatus
	}, 5*time.Second, 10*time.Millisecond, "stack did not reach status %d in time", wantStatus)

	return stack
}

// Tests

func TestBuildAndAsyncDeploy_SaveError_ErrUnauthorized_ReturnsInternalServerError(t *testing.T) {
	t.Parallel()
	builder := &stubBuilder{saveErr: httperrors.ErrUnauthorized}

	_, herr := BuildAndAsyncDeploy(t.Context(), nil, builder, &StackPayload{}, &portainer.Endpoint{}, 0)

	require.NotNil(t, herr)
	assert.Equal(t, http.StatusInternalServerError, herr.StatusCode)
}

func TestBuildAndAsyncDeploy_SaveError_ReturnsInternalServerError(t *testing.T) {
	t.Parallel()
	builder := &stubBuilder{saveErr: errors.New("db error")}

	_, herr := BuildAndAsyncDeploy(t.Context(), nil, builder, &StackPayload{}, &portainer.Endpoint{}, 0)

	require.NotNil(t, herr)
	assert.Equal(t, http.StatusInternalServerError, herr.StatusCode)
}

func TestBuildAndAsyncDeploy_SpawnAsync_DeploySuccess_UpdatesStackStatusToActive(t *testing.T) {
	t.Parallel()
	_, store := datastore.MustNewTestStore(t, true, false)
	stack := &portainer.Stack{ID: 1}
	builder := &stubBuilder{store: store, savedStack: stack}

	_, herr := BuildAndAsyncDeploy(t.Context(), store, builder, &StackPayload{}, &portainer.Endpoint{}, 0)
	require.Nil(t, herr)

	updated := waitForStackStatus(t, store, stack.ID, portainer.StackStatusActive)

	assert.Equal(t, portainer.StackStatusActive, updated.Status)
	require.Len(t, updated.DeploymentStatus, 2)
	assert.Equal(t, portainer.StackStatusDeploying, updated.DeploymentStatus[0].Status)
	assert.Equal(t, portainer.StackStatusActive, updated.DeploymentStatus[1].Status)
}

func TestBuildAndAsyncDeploy_SpawnAsync_DeployFailure_UpdatesStackStatusToError(t *testing.T) {
	t.Parallel()
	deployErr := errors.New("failed to pull image nginx:999")
	_, store := datastore.MustNewTestStore(t, true, false)
	stack := &portainer.Stack{ID: 1}
	builder := &stubBuilder{store: store, savedStack: stack, deployErr: deployErr}

	_, herr := BuildAndAsyncDeploy(t.Context(), store, builder, &StackPayload{}, &portainer.Endpoint{}, 0)
	require.Nil(t, herr)

	updated := waitForStackStatus(t, store, stack.ID, portainer.StackStatusError)

	assert.Equal(t, portainer.StackStatusError, updated.Status)
	require.Len(t, updated.DeploymentStatus, 2)
	assert.Equal(t, portainer.StackStatusDeploying, updated.DeploymentStatus[0].Status)
	lastEntry := updated.DeploymentStatus[1]
	assert.Equal(t, portainer.StackStatusError, lastEntry.Status)
	assert.Equal(t, deployErr.Error(), lastEntry.Message)
}

func TestBuildAndAsyncDeploy_SpawnAsync_PostDeployHook_CalledOnSuccess(t *testing.T) {
	t.Parallel()
	_, store := datastore.MustNewTestStore(t, true, false)
	stack := &portainer.Stack{ID: 1}
	builder := &stubBuilder{store: store, savedStack: stack}

	_, herr := BuildAndAsyncDeploy(t.Context(), store, builder, &StackPayload{}, &portainer.Endpoint{}, 0)
	require.Nil(t, herr)

	waitForStackStatus(t, store, stack.ID, portainer.StackStatusActive)

	require.Eventually(t, builder.hookCalled.Load, 5*time.Second, 10*time.Millisecond, "post-deploy hook should be called after a successful deployment")
}

func TestBuildAndAsyncDeploy_SpawnAsync_PostDeployHook_NotCalledOnDeployFailure(t *testing.T) {
	t.Parallel()
	_, store := datastore.MustNewTestStore(t, true, false)
	stack := &portainer.Stack{ID: 1}
	builder := &stubBuilder{store: store, savedStack: stack, deployErr: errors.New("failed to deploy")}

	_, herr := BuildAndAsyncDeploy(t.Context(), store, builder, &StackPayload{}, &portainer.Endpoint{}, 0)
	require.Nil(t, herr)

	waitForStackStatus(t, store, stack.ID, portainer.StackStatusError)

	require.False(t, builder.hookCalled.Load(), "post-deploy hook should not be called after a failed deployment")
}

func TestBuildAndDeploy_DeployFailure_ReturnsErrorWithoutPersistingStack(t *testing.T) {
	t.Parallel()
	_, store := datastore.MustNewTestStore(t, true, false)
	stack := &portainer.Stack{ID: 1}
	deployErr := errors.New("failed to apply resources")
	builder := &stubBuilder{store: store, savedStack: stack, deployErr: deployErr}

	_, herr := BuildAndDeploy(t.Context(), store, builder, &StackPayload{}, &portainer.Endpoint{}, 0)

	require.NotNil(t, herr)
	assert.Equal(t, http.StatusInternalServerError, herr.StatusCode)

	_, err := store.Stack().Read(stack.ID)
	require.Error(t, err, "a stack that failed to deploy should never be persisted")
}

func TestBuildAndDeploy_DeploySuccess_PersistsActiveStatusSynchronously(t *testing.T) {
	t.Parallel()
	_, store := datastore.MustNewTestStore(t, true, false)
	stack := &portainer.Stack{ID: 1}
	builder := &stubBuilder{store: store, savedStack: stack}

	_, herr := BuildAndDeploy(t.Context(), store, builder, &StackPayload{}, &portainer.Endpoint{}, 0)
	require.Nil(t, herr)

	updated, err := store.Stack().Read(stack.ID)
	require.NoError(t, err)
	assert.Equal(t, portainer.StackStatusActive, updated.Status)
	require.Len(t, updated.DeploymentStatus, 2)
	assert.Equal(t, portainer.StackStatusDeploying, updated.DeploymentStatus[0].Status)
	assert.Equal(t, portainer.StackStatusActive, updated.DeploymentStatus[1].Status)
}

func TestBuildAndDeploy_PostDeployHook_CalledOnSuccess(t *testing.T) {
	t.Parallel()
	_, store := datastore.MustNewTestStore(t, true, false)
	stack := &portainer.Stack{ID: 1}
	builder := &stubBuilder{store: store, savedStack: stack}

	_, herr := BuildAndDeploy(t.Context(), store, builder, &StackPayload{}, &portainer.Endpoint{}, 0)
	require.Nil(t, herr)

	assert.True(t, builder.hookCalled.Load(), "post-deploy hook should be called after a successful deployment")
}

func TestBuildAndDeploy_PostDeployHook_NotCalledOnDeployFailure(t *testing.T) {
	t.Parallel()
	_, store := datastore.MustNewTestStore(t, true, false)
	stack := &portainer.Stack{ID: 1}
	builder := &stubBuilder{store: store, savedStack: stack, deployErr: errors.New("failed to deploy")}

	_, herr := BuildAndDeploy(t.Context(), store, builder, &StackPayload{}, &portainer.Endpoint{}, 0)
	require.NotNil(t, herr)

	assert.False(t, builder.hookCalled.Load(), "post-deploy hook should not be called after a failed deployment")
}
