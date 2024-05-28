package chisel

import (
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/internal/edge/cache"
)

// EdgeJobs retrieves the edge jobs for the given environment
func (service *Service) EdgeJobs(endpointID portainer.EndpointID) []portainer.EdgeJob {
	service.mu.RLock()
	defer service.mu.RUnlock()

	return append(
		make([]portainer.EdgeJob, 0, len(service.edgeJobs[endpointID])),
		service.edgeJobs[endpointID]...,
	)
}

// AddEdgeJob register an EdgeJob inside the tunnel details associated to an environment(endpoint).
func (service *Service) AddEdgeJob(endpoint *portainer.Endpoint, edgeJob *portainer.EdgeJob) {
	if endpoint.Edge.AsyncMode {
		return
	}

	service.mu.Lock()
	defer service.mu.Unlock()

	existingJobIndex := -1
	for idx, existingJob := range service.edgeJobs[endpoint.ID] {
		if existingJob.ID == edgeJob.ID {
			existingJobIndex = idx

			break
		}
	}

	if existingJobIndex == -1 {
		service.edgeJobs[endpoint.ID] = append(service.edgeJobs[endpoint.ID], *edgeJob)
	} else {
		service.edgeJobs[endpoint.ID][existingJobIndex] = *edgeJob
	}

	cache.Del(endpoint.ID)
}

// RemoveEdgeJob will remove the specified Edge job from each tunnel it was registered with.
func (service *Service) RemoveEdgeJob(edgeJobID portainer.EdgeJobID) {
	service.mu.Lock()

	for endpointID := range service.edgeJobs {
		n := 0
		for _, edgeJob := range service.edgeJobs[endpointID] {
			if edgeJob.ID != edgeJobID {
				service.edgeJobs[endpointID][n] = edgeJob
				n++
			}
		}

		service.edgeJobs[endpointID] = service.edgeJobs[endpointID][:n]

		cache.Del(endpointID)
	}

	service.mu.Unlock()
}

func (service *Service) RemoveEdgeJobFromEndpoint(endpointID portainer.EndpointID, edgeJobID portainer.EdgeJobID) {
	service.mu.Lock()
	defer service.mu.Unlock()

	n := 0
	for _, edgeJob := range service.edgeJobs[endpointID] {
		if edgeJob.ID != edgeJobID {
			service.edgeJobs[endpointID][n] = edgeJob
			n++
		}
	}

	service.edgeJobs[endpointID] = service.edgeJobs[endpointID][:n]

	cache.Del(endpointID)
}
