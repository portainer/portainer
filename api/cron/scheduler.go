package cron

import (
	"log"

	"github.com/portainer/portainer"
	"github.com/robfig/cron"
)

// JobScheduler represents a service for managing crons.
type JobScheduler struct {
	cron                 *cron.Cron
	endpointService      portainer.EndpointService
	snapshotter          portainer.Snapshotter
	fileService          portainer.FileService
	jobService           portainer.JobService
	scheduleService      portainer.ScheduleService
	endpointFilePath     string
	endpointSyncInterval string
}

// NewJobScheduler initializes a new service.
func NewJobScheduler(endpointService portainer.EndpointService, snapshotter portainer.Snapshotter, fileService portainer.FileService, jobService portainer.JobService, scheduleService portainer.ScheduleService) *JobScheduler {
	return &JobScheduler{
		cron:            cron.New(),
		endpointService: endpointService,
		snapshotter:     snapshotter,
		jobService:      jobService,
		fileService:     fileService,
		scheduleService: scheduleService,
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
	job := newEndpointSnapshotJob(scheduler.endpointService, scheduler.snapshotter, interval)
	go job.Snapshot()

	return scheduler.cron.AddJob("@every "+interval, job)
}

// UpdateSnapshotJob will update the schedules to match the new snapshot interval
func (scheduler *JobScheduler) UpdateSnapshotJob(interval string) {
	scheduler.updateJobs(func(jon endpointSnapshotJob) { scheduler.ScheduleSnapshotJob(interval) }, nil, nil)
}

// updateJobs updates the jobs in the service
func (scheduler *JobScheduler) updateJobs(updateSnapshotJob func(endpointSnapshotJob), updateSyncJob func(endpointSyncJob), updateScriptJob func(scriptJob)) {
	// TODO: the cron library do not support removing/updating schedules.
	// As a work-around we need to re-create the cron and reschedule the jobs.
	// We should update the library.
	jobs := scheduler.cron.Entries()
	scheduler.cron.Stop()

	scheduler.cron = cron.New()

	for _, job := range jobs {
		switch job.Job.(type) {
		case endpointSnapshotJob:
			internalJob := job.Job.(endpointSnapshotJob)
			if updateSnapshotJob != nil {
				updateSnapshotJob(internalJob)
			} else {
				scheduler.ScheduleSnapshotJob(internalJob.interval)
			}
		case endpointSyncJob:
			internalJob := job.Job.(endpointSyncJob)
			if updateSyncJob != nil {
				updateSyncJob(internalJob)
			} else {
				scheduler.ScheduleEndpointSyncJob(scheduler.endpointFilePath, scheduler.endpointSyncInterval)
			}
		case scriptJob:
			internalJob := job.Job.(scriptJob)
			if updateScriptJob != nil {
				updateScriptJob(internalJob)
			} else {
				scheduler.ScheduleScriptJob(internalJob.scheduleId, internalJob.interval)
			}
		default:
			log.Println("Unsupported job")
		}
	}
	scheduler.cron.Start()
}

// UpdateScriptJob will update the job of the provided scheduleId with the new interval
func (scheduler *JobScheduler) UpdateScriptJob(scheduleId portainer.ScheduleID, interval string) {
	scheduler.updateJobs(nil, nil, func(job scriptJob) {
		if job.scheduleId == scheduleId {
			scheduler.ScheduleScriptJob(job.scheduleId, interval)
		} else {
			scheduler.ScheduleScriptJob(job.scheduleId, job.interval)
		}
	})
}

// ScheduleScriptJob schedules a new script job
func (scheduler *JobScheduler) ScheduleScriptJob(scheduleId portainer.ScheduleID, interval string) error {
	job := newScriptJob(scheduler.fileService, scheduler.jobService, scheduler.scheduleService, scheduler.endpointService, scheduleId, interval)
	go job.RunScript()

	return scheduler.cron.AddJob("@every"+interval, job)
}

func (scheduler *JobScheduler) UnscheduleScriptJob(scheduleId portainer.ScheduleID) {
	scheduler.updateJobs(nil, nil, func(job scriptJob) {
		// rerun only other schedules
		if job.scheduleId != scheduleId {
			scheduler.ScheduleScriptJob(job.scheduleId, job.interval)
		}
	})
}

// Start starts the scheduled jobs
func (scheduler *JobScheduler) Start() {
	if len(scheduler.cron.Entries()) > 0 {
		scheduler.cron.Start()
	}
}
