package cron

import (
	"log"

	"github.com/portainer/portainer"
)

// ScriptExecutionJobRunner is used to run a ScriptExecutionJob
type ScriptExecutionJobRunner struct {
	job     *portainer.ScriptExecutionJob
	context *ScriptExecutionJobContext
}

// ScriptExecutionJobContext represents the context of execution of a ScriptExecutionJob
type ScriptExecutionJobContext struct {
	jobService      portainer.JobService
	endpointService portainer.EndpointService
	fileService     portainer.FileService
}

// NewScriptExecutionJobContext returns a new context that can be used to execute a ScriptExecutionJob
func NewScriptExecutionJobContext(jobService portainer.JobService, endpointService portainer.EndpointService, fileService portainer.FileService) *ScriptExecutionJobContext {
	return &ScriptExecutionJobContext{
		jobService:      jobService,
		endpointService: endpointService,
		fileService:     fileService,
	}
}

// NewScriptExecutionJobRunner returns a new runner that can be scheduled
func NewScriptExecutionJobRunner(job *portainer.ScriptExecutionJob, context *ScriptExecutionJobContext) *ScriptExecutionJobRunner {
	return &ScriptExecutionJobRunner{
		job:     job,
		context: context,
	}
}

// Run triggers the execution of the job.
// It will iterate through all the endpoints specified in the context to
// execute the script associated to the job.
func (runner *ScriptExecutionJobRunner) Run() {
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
func (runner *ScriptExecutionJobRunner) GetScheduleID() portainer.ScheduleID {
	return runner.job.ScheduleID
}

// SetScheduleID sets the schedule identifier associated to the runner
func (runner *ScriptExecutionJobRunner) SetScheduleID(ID portainer.ScheduleID) {
	runner.job.ScheduleID = ID
}

// GetJobType returns the job type associated to the runner
func (runner *ScriptExecutionJobRunner) GetJobType() portainer.JobType {
	return portainer.ScriptExecutionJobType
}
