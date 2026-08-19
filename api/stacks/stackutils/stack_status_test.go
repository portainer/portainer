package stackutils

import (
	"errors"
	"testing"

	portainer "github.com/portainer/portainer/api"

	"github.com/stretchr/testify/require"
)

func TestPrepareStackStatusForDeployment(t *testing.T) {
	t.Parallel()

	stack := &portainer.Stack{
		Status: portainer.StackStatusActive,
	}

	PrepareStackStatusForDeployment(stack)

	require.Equal(t, portainer.StackStatusActive, stack.DeploymentStartStatus)
	require.Equal(t, portainer.StackStatusDeploying, stack.Status)
	require.Len(t, stack.DeploymentStatus, 1)
	require.Equal(t, portainer.StackStatusDeploying, stack.DeploymentStatus[0].Status)
	require.Positive(t, stack.DeploymentStatus[0].Time)
}

func TestUpdateStackStatusFromDeploymentResult(t *testing.T) {
	t.Parallel()

	t.Run("on error", func(t *testing.T) {
		t.Parallel()

		stack := &portainer.Stack{}
		deployErr := errors.New("deployment failed")

		UpdateStackStatusFromDeploymentResult(stack, deployErr)

		require.Equal(t, portainer.StackStatusError, stack.Status)
		require.Len(t, stack.DeploymentStatus, 1)
		require.Equal(t, portainer.StackStatusError, stack.DeploymentStatus[0].Status)
		require.Equal(t, deployErr.Error(), stack.DeploymentStatus[0].Message)
		require.Positive(t, stack.DeploymentStatus[0].Time)
	})

	t.Run("on success", func(t *testing.T) {
		t.Parallel()

		stack := &portainer.Stack{}

		UpdateStackStatusFromDeploymentResult(stack, nil)

		require.Equal(t, portainer.StackStatusActive, stack.Status)
		require.Len(t, stack.DeploymentStatus, 1)
		require.Equal(t, portainer.StackStatusActive, stack.DeploymentStatus[0].Status)
		require.Empty(t, stack.DeploymentStatus[0].Message)
		require.Positive(t, stack.DeploymentStatus[0].Time)
	})
}

func TestUpdateStackStatusFromUndeploymentResult(t *testing.T) {
	t.Parallel()

	t.Run("on error", func(t *testing.T) {
		t.Parallel()

		stack := &portainer.Stack{}
		undeployErr := errors.New("undeployment failed")

		UpdateStackStatusFromUndeploymentResult(stack, undeployErr)

		require.Equal(t, portainer.StackStatusError, stack.Status)
		require.Len(t, stack.DeploymentStatus, 1)
		require.Equal(t, portainer.StackStatusError, stack.DeploymentStatus[0].Status)
		require.Equal(t, undeployErr.Error(), stack.DeploymentStatus[0].Message)
		require.Positive(t, stack.DeploymentStatus[0].Time)
	})

	t.Run("on success", func(t *testing.T) {
		t.Parallel()

		stack := &portainer.Stack{}

		UpdateStackStatusFromUndeploymentResult(stack, nil)

		require.Equal(t, portainer.StackStatusInactive, stack.Status)
		require.Len(t, stack.DeploymentStatus, 1)
		require.Equal(t, portainer.StackStatusInactive, stack.DeploymentStatus[0].Status)
		require.Empty(t, stack.DeploymentStatus[0].Message)
		require.Positive(t, stack.DeploymentStatus[0].Time)
	})
}
