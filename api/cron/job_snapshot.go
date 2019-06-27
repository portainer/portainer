package cron

import (
	"log"

	"github.com/portainer/portainer/api"
)

// SnapshotJobRunner is used to run a SnapshotJob
type SnapshotJobRunner struct {
	schedule *portainer.Schedule
	context  *SnapshotJobContext
}

// SnapshotJobContext represents the context of execution of a SnapshotJob
type SnapshotJobContext struct {
	endpointService portainer.EndpointService
	snapshotter     portainer.Snapshotter
}

// NewSnapshotJobContext returns a new context that can be used to execute a SnapshotJob
func NewSnapshotJobContext(endpointService portainer.EndpointService, snapshotter portainer.Snapshotter) *SnapshotJobContext {
	return &SnapshotJobContext{
		endpointService: endpointService,
		snapshotter:     snapshotter,
	}
}

// NewSnapshotJobRunner returns a new runner that can be scheduled
func NewSnapshotJobRunner(schedule *portainer.Schedule, context *SnapshotJobContext) *SnapshotJobRunner {
	return &SnapshotJobRunner{
		schedule: schedule,
		context:  context,
	}
}

// GetSchedule returns the schedule associated to the runner
func (runner *SnapshotJobRunner) GetSchedule() *portainer.Schedule {
	return runner.schedule
}

// Run triggers the execution of the schedule.
// It will iterate through all the endpoints available in the database to
// create a snapshot of each one of them.
// As a snapshot can be a long process, to avoid any concurrency issue we
// retrieve the latest version of the endpoint right after a snapshot.
func (runner *SnapshotJobRunner) Run() {
	go func() {
		endpoints, err := runner.context.endpointService.Endpoints()
		if err != nil {
			log.Printf("background schedule error (endpoint snapshot). Unable to retrieve endpoint list (err=%s)\n", err)
			return
		}

		for _, endpoint := range endpoints {
			if endpoint.Type == portainer.AzureEnvironment || endpoint.Type == portainer.EdgeAgentEnvironment {
				continue
			}

			snapshot, snapshotError := runner.context.snapshotter.CreateSnapshot(&endpoint)

			latestEndpointReference, err := runner.context.endpointService.Endpoint(endpoint.ID)
			if latestEndpointReference == nil {
				log.Printf("background schedule error (endpoint snapshot). Endpoint not found inside the database anymore (endpoint=%s, URL=%s) (err=%s)\n", endpoint.Name, endpoint.URL, err)
				continue
			}

			latestEndpointReference.Status = portainer.EndpointStatusUp
			if snapshotError != nil {
				log.Printf("background schedule error (endpoint snapshot). Unable to create snapshot (endpoint=%s, URL=%s) (err=%s)\n", endpoint.Name, endpoint.URL, snapshotError)
				latestEndpointReference.Status = portainer.EndpointStatusDown
			}

			if snapshot != nil {
				latestEndpointReference.Snapshots = []portainer.Snapshot{*snapshot}
			}

			err = runner.context.endpointService.UpdateEndpoint(latestEndpointReference.ID, latestEndpointReference)
			if err != nil {
				log.Printf("background schedule error (endpoint snapshot). Unable to update endpoint (endpoint=%s, URL=%s) (err=%s)\n", endpoint.Name, endpoint.URL, err)
				return
			}
		}
	}()
}
