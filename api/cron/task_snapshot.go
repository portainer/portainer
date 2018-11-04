package cron

import (
	"log"

	"github.com/portainer/portainer"
)

type SnapshotTaskContext struct {
	EndpointService portainer.EndpointService
	Snapshotter     portainer.Snapshotter
}

type SnapshotTask struct {
	context *SnapshotTaskContext
}

func NewSnapshotTask(context *SnapshotTaskContext) SnapshotTask {
	return SnapshotTask{
		context: context,
	}
}

func (task SnapshotTask) Run() {
	endpoints, err := task.context.EndpointService.Endpoints()
	if err != nil {
		log.Printf("background task error (endpoint snapshot). Unable to retrieve endpoint list (err=%s)\n", err)
		return
	}

	for _, endpoint := range endpoints {
		if endpoint.Type == portainer.AzureEnvironment {
			continue
		}

		snapshot, err := task.context.Snapshotter.CreateSnapshot(&endpoint)
		endpoint.Status = portainer.EndpointStatusUp
		if err != nil {
			log.Printf("background task error (endpoint snapshot). Unable to create snapshot (endpoint=%s, URL=%s) (err=%s)\n", endpoint.Name, endpoint.URL, err)
			endpoint.Status = portainer.EndpointStatusDown
		}

		if snapshot != nil {
			endpoint.Snapshots = []portainer.Snapshot{*snapshot}
		}

		err = task.context.EndpointService.UpdateEndpoint(endpoint.ID, &endpoint)
		if err != nil {
			log.Printf("background task error (endpoint snapshot). Unable to update endpoint (endpoint=%s, URL=%s) (err=%s)\n", endpoint.Name, endpoint.URL, err)
			return
		}
	}
}
