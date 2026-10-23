package stacks

import (
	"context"
	"errors"
	"testing"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/datastore"
	"github.com/portainer/portainer/api/stacks/deployments"
	"github.com/portainer/portainer/api/stacks/stackutils"

	"github.com/stretchr/testify/require"
)

type stubStackDeploymentConfiger struct {
	deployments.StackDeploymentConfiger
	deployErr error
}

func (s *stubStackDeploymentConfiger) Deploy(_ context.Context) error { return s.deployErr }

func TestStackDeployInline(t *testing.T) {
	t.Parallel()

	t.Run("successful deploy persists Active status and calls postDeploy with a nil error", func(t *testing.T) {
		t.Parallel()

		_, store := datastore.MustNewTestStore(t, true, false)
		stack := &portainer.Stack{ID: 1, Status: portainer.StackStatusActive}
		stackutils.PrepareStackStatusForDeployment(stack)
		require.NoError(t, store.Stack().Create(stack))

		handler := &Handler{DataStore: store}

		var postDeployCalled bool
		var postDeployErr error
		postDeploy := func(_ context.Context, err error) {
			postDeployCalled = true
			postDeployErr = err
		}

		httpErr := handler.stackDeployInline(stack, &stubStackDeploymentConfiger{}, postDeploy)
		require.Nil(t, httpErr)

		updated, err := store.Stack().Read(stack.ID)
		require.NoError(t, err)
		require.Equal(t, portainer.StackStatusActive, updated.Status)
		require.Len(t, updated.DeploymentStatus, 2, "expected the persisted Deploying entry followed by an Active entry")
		require.Equal(t, portainer.StackStatusDeploying, updated.DeploymentStatus[0].Status)
		require.Equal(t, portainer.StackStatusActive, updated.DeploymentStatus[1].Status)

		require.True(t, postDeployCalled)
		require.NoError(t, postDeployErr)
	})

	t.Run("failed deploy transitions status to Error, calls postDeploy with the error, and returns an error", func(t *testing.T) {
		t.Parallel()

		_, store := datastore.MustNewTestStore(t, true, false)
		stack := &portainer.Stack{ID: 1, Status: portainer.StackStatusActive}
		stackutils.PrepareStackStatusForDeployment(stack)
		require.NoError(t, store.Stack().Create(stack))

		handler := &Handler{DataStore: store}

		deployErr := errors.New("failed to apply resources")

		var postDeployCalled bool
		var postDeployErr error
		postDeploy := func(_ context.Context, err error) {
			postDeployCalled = true
			postDeployErr = err
		}

		httpErr := handler.stackDeployInline(stack, &stubStackDeploymentConfiger{deployErr: deployErr}, postDeploy)
		require.NotNil(t, httpErr)

		updated, err := store.Stack().Read(stack.ID)
		require.NoError(t, err)
		require.Equal(t, portainer.StackStatusError, updated.Status, "status should transition to Error so the stack doesn't get stuck showing Deploying and can be retried")
		require.Len(t, updated.DeploymentStatus, 2, "expected the persisted Deploying entry followed by an Error entry")
		require.Equal(t, portainer.StackStatusDeploying, updated.DeploymentStatus[0].Status)
		lastEntry := updated.DeploymentStatus[1]
		require.Equal(t, portainer.StackStatusError, lastEntry.Status)
		require.Equal(t, deployErr.Error(), lastEntry.Message)

		require.True(t, postDeployCalled)
		require.Equal(t, deployErr, postDeployErr)
	})

	t.Run("postDeploy may be nil", func(t *testing.T) {
		t.Parallel()

		_, store := datastore.MustNewTestStore(t, true, false)
		stack := &portainer.Stack{ID: 1, Status: portainer.StackStatusActive}
		stackutils.PrepareStackStatusForDeployment(stack)
		require.NoError(t, store.Stack().Create(stack))

		handler := &Handler{DataStore: store}

		httpErr := handler.stackDeployInline(stack, &stubStackDeploymentConfiger{}, nil)
		require.Nil(t, httpErr)
	})
}
