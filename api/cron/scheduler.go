package cron

import (
	"github.com/portainer/portainer"
	"github.com/robfig/cron"
)

// JobScheduler represents a service for managing crons.
type JobScheduler struct {
	cron *cron.Cron
}

// NewJobScheduler initializes a new service.
func NewJobScheduler() *JobScheduler {
	return &JobScheduler{
		cron: cron.New(),
	}
}

// UpdateScheduledTask updates a specific scheduled task by re-creating a new cron
// and adding all the existing jobs. It will then re-schedule the new task
// based on the updatedTask parameter.
// NOTE: the cron library do not support updating schedules directly
// hence the work-around.
func (scheduler *JobScheduler) UpdateScheduledTask(scheduleID portainer.ScheduleID, cronExpression string, updatedTask portainer.Task) error {
	jobs := scheduler.cron.Entries()
	newCron := cron.New()

	for _, job := range jobs {

		switch task := job.Job.(type) {
		case ScriptTask:
			if task.context.ScheduleID == scheduleID {
				err := newCron.AddJob(cronExpression, updatedTask)
				if err != nil {
					return err
				}

				continue
			}
		case SnapshotTask:
			_, ok := updatedTask.(SnapshotTask)
			if ok {
				err := newCron.AddJob(cronExpression, job.Job)
				if err != nil {
					return err
				}

				continue
			}
		}

		newCron.Schedule(job.Schedule, job.Job)
	}

	scheduler.cron.Stop()
	scheduler.cron = newCron
	scheduler.cron.Start()
	return nil
}

// UnscheduleTask remove a schedule by re-creating a new cron
// and adding all the existing jobs except for the one specified via scheduleID.
// NOTE: the cron library do not support removing schedules directly
// hence the work-around.
func (scheduler *JobScheduler) UnscheduleTask(scheduleID portainer.ScheduleID) {
	jobs := scheduler.cron.Entries()

	newCron := cron.New()

	for _, job := range jobs {

		switch task := job.Job.(type) {
		case ScriptTask:
			if task.context.ScheduleID == scheduleID {
				continue
			}
		}

		newCron.Schedule(job.Schedule, job.Job)
	}

	scheduler.cron.Stop()
	scheduler.cron = newCron
	scheduler.cron.Start()
}

// ScheduleTask adds a new task to be scheduled in the cron.
func (scheduler *JobScheduler) ScheduleTask(cronExpression string, task portainer.Task) error {
	return scheduler.cron.AddJob(cronExpression, task)
}

// Start starts the scheduled jobs
func (scheduler *JobScheduler) Start() {
	if len(scheduler.cron.Entries()) > 0 {
		scheduler.cron.Start()
	}
}
