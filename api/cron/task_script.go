package cron

import (
	"log"

	"github.com/portainer/portainer"
)

type ScriptTaskContext struct {
	JobService      portainer.JobService
	EndpointService portainer.EndpointService
	FileService     portainer.FileService
	ScheduleID      portainer.ScheduleID
	TargetEndpoints []portainer.EndpointID
}

type ScriptTask struct {
	Image      string
	ScriptPath string
	context    *ScriptTaskContext
}

func NewScriptTask(image, scriptPath string, context *ScriptTaskContext) ScriptTask {
	return ScriptTask{
		Image:      image,
		ScriptPath: scriptPath,
		context:    context,
	}
}

func (task ScriptTask) SetContext(context *ScriptTaskContext) {
	task.context = context
}

func (task ScriptTask) Run() {
	scriptFile, err := task.context.FileService.GetFileContent(task.ScriptPath)
	if err != nil {
		log.Printf("scheduled task error (script execution). Unable to retrieve script file (err=%s)\n", err)
		return
	}

	for _, endpointId := range task.context.TargetEndpoints {
		endpoint, err := task.context.EndpointService.Endpoint(endpointId)
		if err != nil {
			log.Printf("scheduled task error (script execution). Unable to retrieve information about endpoint (id=%d) (err=%s)\n", endpointId, err)
			return
		}

		err = task.context.JobService.Execute(endpoint, "", task.Image, scriptFile)
		if err != nil {
			log.Printf("scheduled task error (script execution). Unable to execute scrtip (endpoint=%s) (err=%s)\n", endpoint.Name, err)
		}
	}
}
