package cron

import (
	"log"

	"github.com/portainer/portainer"
)

// ScriptTaskContext represents the context required for the execution
// of a ScriptTask.
type ScriptTaskContext struct {
	JobService      portainer.JobService
	EndpointService portainer.EndpointService
	FileService     portainer.FileService
	ScheduleID      portainer.ScheduleID
	TargetEndpoints []portainer.EndpointID
}

// ScriptTask represents a task used to execute a script inside a privileged
// container. It can be scheduled.
type ScriptTask struct {
	Image      string
	ScriptPath string
	context    *ScriptTaskContext
}

// NewScriptTask creates a new ScriptTask using the specified context.
func NewScriptTask(image, scriptPath string, context *ScriptTaskContext) ScriptTask {
	return ScriptTask{
		Image:      image,
		ScriptPath: scriptPath,
		context:    context,
	}
}

// SetContext can be used to set/override the task context
func (task ScriptTask) SetContext(context *ScriptTaskContext) {
	task.context = context
}

// Run triggers the execution of the task.
// It will iterate through all the endpoints specified in the context to
// execute the script associated to the task.
func (task ScriptTask) Run() {
	scriptFile, err := task.context.FileService.GetFileContent(task.ScriptPath)
	if err != nil {
		log.Printf("scheduled task error (script execution). Unable to retrieve script file (err=%s)\n", err)
		return
	}

	for _, endpointID := range task.context.TargetEndpoints {
		endpoint, err := task.context.EndpointService.Endpoint(endpointID)
		if err != nil {
			log.Printf("scheduled task error (script execution). Unable to retrieve information about endpoint (id=%d) (err=%s)\n", endpointID, err)
			return
		}

		err = task.context.JobService.Execute(endpoint, "", task.Image, scriptFile)
		if err != nil {
			log.Printf("scheduled task error (script execution). Unable to execute scrtip (endpoint=%s) (err=%s)\n", endpoint.Name, err)
		}
	}
}
