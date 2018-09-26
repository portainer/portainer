package cron

import (
	"log"

	"github.com/portainer/portainer"
)

type (
	endpointSnapshotJob struct {
		endpointService portainer.EndpointService
		snapshotter     portainer.Snapshotter
	}
)

func newEndpointSnapshotJob(endpointService portainer.EndpointService, snapshotter portainer.Snapshotter) endpointSnapshotJob {
	return endpointSnapshotJob{
		endpointService: endpointService,
		snapshotter:     snapshotter,
	}
}

func (job endpointSnapshotJob) Snapshot() error {

	endpoints, err := job.endpointService.Endpoints()
	if err != nil {
		return err
	}

	for _, endpoint := range endpoints {
		if endpoint.Type == portainer.AzureEnvironment {
			continue
		}

		go func() {
			snapshot, err := job.snapshotter.CreateSnapshot(&endpoint)
			endpoint.Status = portainer.EndpointStatusUp
			if err != nil {
				log.Printf("cron error: endpoint snapshot error (endpoint=%s, URL=%s) (err=%s)\n", endpoint.Name, endpoint.URL, err)
				endpoint.Status = portainer.EndpointStatusDown
			}

			if snapshot != nil {
				endpoint.Snapshots = []portainer.Snapshot{*snapshot}
			}
		}()

		err = job.endpointService.UpdateEndpoint(endpoint.ID, &endpoint)
		if err != nil {
			return err
		}
	}

	return nil
}

func (job endpointSnapshotJob) Run() {
	err := job.Snapshot()
	if err != nil {
		log.Printf("cron error: snapshot job error (err=%s)\n", err)
	}
}
