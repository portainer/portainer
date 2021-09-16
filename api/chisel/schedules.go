package chisel

import (
	"strconv"

	portainer "github.com/portainer/portainer/api"
)

// AddEdgeJob register an EdgeJob inside the tunnel details associated to an environment(endpoint).
func (service *Service) AddEdgeJob(endpointID portainer.EndpointID, edgeJob *portainer.EdgeJob) {
	tunnel := service.GetTunnelDetails(endpointID)

	existingJobIndex := -1
	for idx, existingJob := range tunnel.Jobs {
		if existingJob.ID == edgeJob.ID {
			existingJobIndex = idx
			break
		}
	}

	if existingJobIndex == -1 {
		tunnel.Jobs = append(tunnel.Jobs, *edgeJob)
	} else {
		tunnel.Jobs[existingJobIndex] = *edgeJob
	}

	key := strconv.Itoa(int(endpointID))
	service.tunnelDetailsMap.Set(key, tunnel)
}

// RemoveEdgeJob will remove the specified Edge job from each tunnel it was registered with.
func (service *Service) RemoveEdgeJob(edgeJobID portainer.EdgeJobID) {
	for item := range service.tunnelDetailsMap.IterBuffered() {
		tunnelDetails := item.Val.(*portainer.TunnelDetails)

		updatedJobs := make([]portainer.EdgeJob, 0)
		for _, edgeJob := range tunnelDetails.Jobs {
			if edgeJob.ID == edgeJobID {
				continue
			}
			updatedJobs = append(updatedJobs, edgeJob)
		}

		tunnelDetails.Jobs = updatedJobs
		service.tunnelDetailsMap.Set(item.Key, tunnelDetails)
	}
}
