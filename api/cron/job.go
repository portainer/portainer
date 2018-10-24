package cron

import (
	"log"

	"github.com/portainer/portainer"
)

type scriptJob struct {
	jobService      portainer.JobService
	scheduleService portainer.ScheduleService
	endpointService portainer.EndpointService
	fileService     portainer.FileService
	scheduleId      portainer.ScheduleID
	interval        string
}

func newScriptJob(fileService portainer.FileService, jobService portainer.JobService, scheduleService portainer.ScheduleService, endpointService portainer.EndpointService, scheduleId portainer.ScheduleID, interval string) scriptJob {
	return scriptJob{
		jobService:      jobService,
		scheduleId:      scheduleId,
		scheduleService: scheduleService,
		endpointService: endpointService,
		fileService:     fileService,
		interval:        interval,
	}
}

func (job scriptJob) RunScript() error {
	schedule, err := job.scheduleService.Schedule(job.scheduleId)
	if err != nil {
		return err
	}
	for _, endpointId := range schedule.Endpoints {
		endpoint, err := job.endpointService.Endpoint(endpointId)
		if err != nil {
			return err
		}

		file, err := job.fileService.GetFileContent(schedule.ScriptPath)
		if err != nil {
			return err
		}
		// TODO can the user choose image?
		err = job.jobService.Execute(endpoint, "ubuntu:latest", file)
		if err != nil {
			return err
		}
	}
	return nil
}

func (job scriptJob) Run() {
	err := job.RunScript()
	if err != nil {
		log.Printf("cron error: script schedule job error (err=%s)\n", err)
	}
}
