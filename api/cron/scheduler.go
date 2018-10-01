package cron

import (
	"log"

	"github.com/portainer/portainer"
	"github.com/robfig/cron"
)

// JobScheduler represents a service for managing crons.
type JobScheduler struct {
	cron            *cron.Cron
	endpointService portainer.EndpointService
	snapshotter     portainer.Snapshotter

	endpointFilePath     string
	endpointSyncInterval string
}

// NewJobScheduler initializes a new service.
func NewJobScheduler(endpointService portainer.EndpointService, snapshotter portainer.Snapshotter) *JobScheduler {
	return &JobScheduler{
		cron:            cron.New(),
		endpointService: endpointService,
		snapshotter:     snapshotter,
	}
}

// ScheduleEndpointSyncJob schedules a cron job to synchronize the endpoints from a file
func (scheduler *JobScheduler) ScheduleEndpointSyncJob(endpointFilePath string, interval string) error {

	scheduler.endpointFilePath = endpointFilePath
	scheduler.endpointSyncInterval = interval

	job := newEndpointSyncJob(endpointFilePath, scheduler.endpointService)

	err := job.Sync()
	if err != nil {
		return err
	}

	return scheduler.cron.AddJob("@every "+interval, job)
}

// ScheduleSnapshotJob schedules a cron job to create endpoint snapshots
func (scheduler *JobScheduler) ScheduleSnapshotJob(interval string) error {
	job := newEndpointSnapshotJob(scheduler.endpointService, scheduler.snapshotter)
	go job.Snapshot()

	return scheduler.cron.AddJob("@every "+interval, job)
}

// UpdateSnapshotJob will update the schedules to match the new snapshot interval
func (scheduler *JobScheduler) UpdateSnapshotJob(interval string) {
	// TODO: the cron library do not support removing/updating schedules.
	// As a work-around we need to re-create the cron and reschedule the jobs.
	// We should update the library.
	jobs := scheduler.cron.Entries()
	scheduler.cron.Stop()

	scheduler.cron = cron.New()

	for _, job := range jobs {
		switch job.Job.(type) {
		case endpointSnapshotJob:
			scheduler.ScheduleSnapshotJob(interval)
		case endpointSyncJob:
			scheduler.ScheduleEndpointSyncJob(scheduler.endpointFilePath, scheduler.endpointSyncInterval)
		default:
			log.Println("Unsupported job")
		}
	}

	scheduler.cron.Start()
}

// Start starts the scheduled jobs
func (scheduler *JobScheduler) Start() {
	if len(scheduler.cron.Entries()) > 0 {
		scheduler.cron.Start()
	}
}
