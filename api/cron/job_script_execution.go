package cron

import (
	"log"

	"github.com/portainer/portainer"
)

type scriptExecutionJobRunner struct {
	job     *portainer.ScriptExecutionJob
	context *scriptExecutionJobContext
}

type scriptExecutionJobContext struct {
	jobService      portainer.JobService
	endpointService portainer.EndpointService
	fileService     portainer.FileService
}

func NewScriptExecutionJobContext(jobService portainer.JobService, endpointService portainer.EndpointService, fileService portainer.FileService) *scriptExecutionJobContext {
	return &scriptExecutionJobContext{
		jobService:      jobService,
		endpointService: endpointService,
		fileService:     fileService,
	}
}

func NewScriptExecutionJobRunner(job *portainer.ScriptExecutionJob, context *scriptExecutionJobContext) *scriptExecutionJobRunner {
	return &scriptExecutionJobRunner{
		job:     job,
		context: context,
	}
}

// Run triggers the execution of the job.
// It will iterate through all the endpoints specified in the context to
// execute the script associated to the job.
func (runner *scriptExecutionJobRunner) Run() {
	scriptFile, err := runner.context.fileService.GetFileContent(runner.job.ScriptPath)
	if err != nil {
		log.Printf("scheduled job error (script execution). Unable to retrieve script file (err=%s)\n", err)
		return
	}

	for _, endpointID := range runner.job.Endpoints {
		endpoint, err := runner.context.endpointService.Endpoint(endpointID)
		if err != nil {
			log.Printf("scheduled job error (script execution). Unable to retrieve information about endpoint (id=%d) (err=%s)\n", endpointID, err)
			return
		}

		err = runner.context.jobService.Execute(endpoint, "", runner.job.Image, scriptFile)
		if err != nil {
			log.Printf("scheduled job error (script execution). Unable to execute scrtip (endpoint=%s) (err=%s)\n", endpoint.Name, err)
		}
	}
}

// GetScheduleID returns the schedule identifier associated to the runner
func (runner *scriptExecutionJobRunner) GetScheduleID() portainer.ScheduleID {
	return runner.job.ScheduleID
}

// SetScheduleID sets the schedule identifier associated to the runner
func (runner *scriptExecutionJobRunner) SetScheduleID(ID portainer.ScheduleID) {
	runner.job.ScheduleID = ID
}

// GetJobType returns the job type associated to the runner
func (runner *scriptExecutionJobRunner) GetJobType() portainer.JobType {
	return portainer.ScriptExecutionJobType
}
