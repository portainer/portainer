package cron

import (
	"log"

	"github.com/portainer/portainer"
)

type snapshotJobRunner struct {
	job     *portainer.SnapshotJob
	context *snapshotJobContext
}

type snapshotJobContext struct {
	endpointService portainer.EndpointService
	snapshotter     portainer.Snapshotter
}

// NewSnapshotJobContext returns a new context that can be used to execute a SnapshotJob
func NewSnapshotJobContext(endpointService portainer.EndpointService, snapshotter portainer.Snapshotter) *snapshotJobContext {
	return &snapshotJobContext{
		endpointService: endpointService,
		snapshotter:     snapshotter,
	}
}

// NewSnapshotJobRunner returns a new runner that can be scheduled
func NewSnapshotJobRunner(job *portainer.SnapshotJob, context *snapshotJobContext) *snapshotJobRunner {
	return &snapshotJobRunner{
		job:     job,
		context: context,
	}
}

// GetScheduleID returns the schedule identifier associated to the runner
func (runner *snapshotJobRunner) GetScheduleID() portainer.ScheduleID {
	return runner.job.ScheduleID
}

// SetScheduleID sets the schedule identifier associated to the runner
func (runner *snapshotJobRunner) SetScheduleID(ID portainer.ScheduleID) {
	runner.job.ScheduleID = ID
}

// GetJobType returns the job type associated to the runner
func (runner *snapshotJobRunner) GetJobType() portainer.JobType {
	return portainer.EndpointSyncJobType
}

// Run triggers the execution of the job.
// It will iterate through all the endpoints available in the database to
// create a snapshot of each one of them.
func (runner *snapshotJobRunner) Run() {
	endpoints, err := runner.context.endpointService.Endpoints()
	if err != nil {
		log.Printf("background job error (endpoint snapshot). Unable to retrieve endpoint list (err=%s)\n", err)
		return
	}

	for _, endpoint := range endpoints {
		if endpoint.Type == portainer.AzureEnvironment {
			continue
		}

		snapshot, err := runner.context.snapshotter.CreateSnapshot(&endpoint)
		endpoint.Status = portainer.EndpointStatusUp
		if err != nil {
			log.Printf("background job error (endpoint snapshot). Unable to create snapshot (endpoint=%s, URL=%s) (err=%s)\n", endpoint.Name, endpoint.URL, err)
			endpoint.Status = portainer.EndpointStatusDown
		}

		if snapshot != nil {
			endpoint.Snapshots = []portainer.Snapshot{*snapshot}
		}

		err = runner.context.endpointService.UpdateEndpoint(endpoint.ID, &endpoint)
		if err != nil {
			log.Printf("background job error (endpoint snapshot). Unable to update endpoint (endpoint=%s, URL=%s) (err=%s)\n", endpoint.Name, endpoint.URL, err)
			return
		}
	}
}
