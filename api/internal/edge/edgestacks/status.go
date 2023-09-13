package edgestacks

import (
	portainer "github.com/portainer/portainer/api"
)

// NewStatus returns a new status object for an Edge stack
func NewStatus(oldStatus map[portainer.EndpointID]portainer.EdgeStackStatus, relatedEnvironmentIDs []portainer.EndpointID) map[portainer.EndpointID]portainer.EdgeStackStatus {
	status := map[portainer.EndpointID]portainer.EdgeStackStatus{}

	for _, environmentID := range relatedEnvironmentIDs {

		newEnvStatus := portainer.EdgeStackStatus{
			Status:     []portainer.EdgeStackDeploymentStatus{},
			EndpointID: portainer.EndpointID(environmentID),
		}

		oldEnvStatus, ok := oldStatus[environmentID]
		if ok {
			newEnvStatus.DeploymentInfo = oldEnvStatus.DeploymentInfo
		}

		status[environmentID] = newEnvStatus
	}

	return status
}
