package stackutils

import (
	"time"

	portainer "github.com/portainer/portainer/api"
)

// InlineDeployTimeout bounds a synchronous, inline stack deploy.
const InlineDeployTimeout = time.Minute

// PrepareStackStatusForDeployment transitions a stack into the deploying state before a deployment begins.
// It saves the current status in DeploymentStartStatus so that pre-deployment actions can be determined
// (e.g. whether to undeploy before redeploying), sets Status to StackStatusDeploying, and resets the
// DeploymentStatus history with a single deploying entry.
func PrepareStackStatusForDeployment(stack *portainer.Stack) {
	stack.DeploymentStartStatus = stack.Status
	stack.Status = portainer.StackStatusDeploying
	stack.DeploymentStatus = []portainer.StackDeploymentStatus{
		{Status: portainer.StackStatusDeploying, Time: time.Now().Unix()},
	}
}

// UpdateStackStatusFromDeploymentResult updates a stack's status after a deployment attempt completes.
// On success (err == nil) the stack is marked active; on failure it is marked as errored with the error message recorded.
func UpdateStackStatusFromDeploymentResult(stack *portainer.Stack, err error) {
	if err != nil {
		stack.Status = portainer.StackStatusError
		stack.DeploymentStatus = append(stack.DeploymentStatus, portainer.StackDeploymentStatus{
			Status:  portainer.StackStatusError,
			Time:    time.Now().Unix(),
			Message: err.Error(),
		})

		return
	}

	stack.Status = portainer.StackStatusActive
	stack.DeploymentStatus = append(stack.DeploymentStatus, portainer.StackDeploymentStatus{
		Status: portainer.StackStatusActive,
		Time:   time.Now().Unix(),
	})
}

// UpdateStackStatusFromUndeploymentResult updates a stack's status after an undeployment attempt completes.
// On success (err == nil) the stack is marked inactive; on failure it is marked as errored with the error message recorded.
func UpdateStackStatusFromUndeploymentResult(stack *portainer.Stack, err error) {
	if err != nil {
		stack.Status = portainer.StackStatusError
		stack.DeploymentStatus = append(stack.DeploymentStatus, portainer.StackDeploymentStatus{
			Status:  portainer.StackStatusError,
			Time:    time.Now().Unix(),
			Message: err.Error(),
		})

		return
	}

	stack.Status = portainer.StackStatusInactive
	stack.DeploymentStatus = append(stack.DeploymentStatus, portainer.StackDeploymentStatus{
		Status: portainer.StackStatusInactive,
		Time:   time.Now().Unix(),
	})
}
