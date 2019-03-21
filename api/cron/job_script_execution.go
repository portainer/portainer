package cron

import (
	"log"
	"time"

	"github.com/portainer/portainer/api"
)

// ScriptExecutionJobRunner is used to run a ScriptExecutionJob
type ScriptExecutionJobRunner struct {
	schedule     *portainer.Schedule
	context      *ScriptExecutionJobContext
	executedOnce bool
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
func NewScriptExecutionJobRunner(schedule *portainer.Schedule, context *ScriptExecutionJobContext) *ScriptExecutionJobRunner {
	return &ScriptExecutionJobRunner{
		schedule:     schedule,
		context:      context,
		executedOnce: false,
	}
}

// Run triggers the execution of the job.
// It will iterate through all the endpoints specified in the context to
// execute the script associated to the job.
func (runner *ScriptExecutionJobRunner) Run() {
	if !runner.schedule.Recurring && runner.executedOnce {
		return
	}
	runner.executedOnce = true

	scriptFile, err := runner.context.fileService.GetFileContent(runner.schedule.ScriptExecutionJob.ScriptPath)
	if err != nil {
		log.Printf("scheduled job error (script execution). Unable to retrieve script file (err=%s)\n", err)
		return
	}

	targets := make([]*portainer.Endpoint, 0)
	for _, endpointID := range runner.schedule.ScriptExecutionJob.Endpoints {
		endpoint, err := runner.context.endpointService.Endpoint(endpointID)
		if err != nil {
			log.Printf("scheduled job error (script execution). Unable to retrieve information about endpoint (id=%d) (err=%s)\n", endpointID, err)
			return
		}

		targets = append(targets, endpoint)
	}

	runner.executeAndRetry(targets, scriptFile, 0)
}

func (runner *ScriptExecutionJobRunner) executeAndRetry(endpoints []*portainer.Endpoint, script []byte, retryCount int) {
	retryTargets := make([]*portainer.Endpoint, 0)

	for _, endpoint := range endpoints {
		err := runner.context.jobService.ExecuteScript(endpoint, "", runner.schedule.ScriptExecutionJob.Image, script, runner.schedule)
		if err == portainer.ErrUnableToPingEndpoint {
			retryTargets = append(retryTargets, endpoint)
		} else if err != nil {
			log.Printf("scheduled job error (script execution). Unable to execute script (endpoint=%s) (err=%s)\n", endpoint.Name, err)
		}
	}

	retryCount++
	if retryCount >= runner.schedule.ScriptExecutionJob.RetryCount {
		return
	}

	time.Sleep(time.Duration(runner.schedule.ScriptExecutionJob.RetryInterval) * time.Second)

	runner.executeAndRetry(retryTargets, script, retryCount)
}

// GetSchedule returns the schedule associated to the runner
func (runner *ScriptExecutionJobRunner) GetSchedule() *portainer.Schedule {
	return runner.schedule
}
