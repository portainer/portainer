package cron

import (
	"log"

	"github.com/portainer/portainer"
	"github.com/portainer/portainer/docker"
)

type (
	endpointSnapshotJob struct {
		endpointService portainer.EndpointService
		snapshotter     *docker.Snapshotter
	}
)

func newEndpointSnapshotJob(endpointService portainer.EndpointService, snapshotter *docker.Snapshotter) endpointSnapshotJob {
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
		snapshot, err := job.snapshotter.CreateSnapshot(&endpoint)
		if err != nil {
			log.Printf("cron error: endpoint snapshot error (endpoint=%s, URL=%s) (err=%s)\n", endpoint.Name, endpoint.URL, err)
			endpoint.Status = portainer.EndpointStatusDown
		}

		// TODO: at the moment, only persist one snapshot
		if snapshot != nil {
			endpoint.Snapshots = []portainer.Snapshot{*snapshot}
		}

		err = job.endpointService.UpdateEndpoint(endpoint.ID, &endpoint)
		if err != nil {
			return err
		}
	}

	return nil
}

func (job endpointSnapshotJob) Run() {
	// TODO: should be a debug statement
	log.Println("cron: snapshot job started")
	err := job.Snapshot()
	if err != nil {
		log.Printf("cron error: snapshot job error (err=%s)\n", err)
	}
}
