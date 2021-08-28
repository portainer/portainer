package stacks

import (
	"log"
	"net/http"
	"time"

	httperror "github.com/portainer/libhttp/error"
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/scheduler"
	"github.com/portainer/portainer/api/stacks"
)

func startAutoupdate(stackID portainer.StackID, interval string, scheduler *scheduler.Scheduler, stackDeployer stacks.StackDeployer, datastore portainer.DataStore, gitService portainer.GitService) (jobID string, e *httperror.HandlerError) {
	d, err := time.ParseDuration(interval)
	if err != nil {
		return "", &httperror.HandlerError{StatusCode: http.StatusBadRequest, Message: "Unable to parse stack's auto update interval", Err: err}
	}

	jobID = scheduler.StartJobEvery(d, func() {
		if err := stacks.RedeployWhenChanged(stackID, stackDeployer, datastore, gitService); err != nil {
			log.Printf("[ERROR] [http,stacks] [message: failed redeploying] [err: %s]\n", err)
		}
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
