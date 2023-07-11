package chisel

import (
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/internal/edge/cache"
)

// AddEdgeJob register an EdgeJob inside the tunnel details associated to an environment(endpoint).
func (service *Service) AddEdgeJob(endpoint *portainer.Endpoint, edgeJob *portainer.EdgeJob) {
	if endpoint.Edge.AsyncMode {
		return
	}

	service.mu.Lock()
	tunnel := service.getTunnelDetails(endpoint.ID)

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

	cache.Del(endpoint.ID)

	service.mu.Unlock()
}

// RemoveEdgeJob will remove the specified Edge job from each tunnel it was registered with.
func (service *Service) RemoveEdgeJob(edgeJobID portainer.EdgeJobID) {
	service.mu.Lock()

	for endpointID, tunnel := range service.tunnelDetailsMap {
		n := 0
		for _, edgeJob := range tunnel.Jobs {
			if edgeJob.ID != edgeJobID {
				tunnel.Jobs[n] = edgeJob
				n++
			}
		}

		tunnel.Jobs = tunnel.Jobs[:n]

		cache.Del(endpointID)
	}

	service.mu.Unlock()
}

func (service *Service) RemoveEdgeJobFromEndpoint(endpointID portainer.EndpointID, edgeJobID portainer.EdgeJobID) {
	service.mu.Lock()
	tunnel := service.getTunnelDetails(endpointID)

	n := 0
	for _, edgeJob := range tunnel.Jobs {
		if edgeJob.ID != edgeJobID {
			tunnel.Jobs[n] = edgeJob
			n++
		}
	}

	tunnel.Jobs = tunnel.Jobs[:n]

	cache.Del(endpointID)

	service.mu.Unlock()
}
