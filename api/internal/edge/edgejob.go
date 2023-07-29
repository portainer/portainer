package edge

import (
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
)

// LoadEdgeJobs registers all edge jobs inside corresponding environment(endpoint) tunnel
func LoadEdgeJobs(dataStore dataservices.DataStore, reverseTunnelService portainer.ReverseTunnelService) error {
	edgeJobs, err := dataStore.EdgeJob().ReadAll()
	if err != nil {
		return err
	}

	for _, edgeJob := range edgeJobs {
		for endpointID := range edgeJob.Endpoints {
			endpoint, err := dataStore.Endpoint().Endpoint(endpointID)
			if err != nil {
				return err
			}

			reverseTunnelService.AddEdgeJob(endpoint, &edgeJob)
		}
	}

	return nil
}
