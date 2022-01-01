package stacks

import (
	"log"
	"net/http"
	"time"

	httperror "github.com/portainer/libhttp/error"
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	"github.com/portainer/portainer/api/scheduler"
	"github.com/portainer/portainer/api/stacks"
)

func startAutoupdate(stackID portainer.StackID, interval string, scheduler *scheduler.Scheduler, stackDeployer stacks.StackDeployer, datastore dataservices.DataStore, gitService portainer.GitService) (jobID string, e *httperror.HandlerError) {
	d, err := time.ParseDuration(interval)
	if err != nil {
		return "", &httperror.HandlerError{StatusCode: http.StatusBadRequest, Message: "Unable to parse stack's auto update interval", Err: err}
	}

	jobID = scheduler.StartJobEvery(d, func() error {
		return stacks.RedeployWhenChanged(stackID, stackDeployer, datastore, gitService)
	})

	return jobID, nil
}

func stopAutoupdate(stackID portainer.StackID, jobID string, scheduler scheduler.Scheduler) {
	if jobID == "" {
		return
	}

	if err := scheduler.StopJob(jobID); err != nil {
		log.Printf("[WARN] could not stop the job for the stack %v", stackID)
	}

}
