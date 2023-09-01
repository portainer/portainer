package deployments

import (
	"time"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	"github.com/portainer/portainer/api/scheduler"
	httperror "github.com/portainer/portainer/pkg/libhttp/error"

	"github.com/rs/zerolog/log"
)

func StartAutoupdate(stackID portainer.StackID, interval string, scheduler *scheduler.Scheduler, stackDeployer StackDeployer, datastore dataservices.DataStore, gitService portainer.GitService) (jobID string, e *httperror.HandlerError) {
	d, err := time.ParseDuration(interval)
	if err != nil {
		return "", httperror.BadRequest("Unable to parse stack's auto update interval", err)
	}

	jobID = scheduler.StartJobEvery(d, func() error {
		return RedeployWhenChanged(stackID, stackDeployer, datastore, gitService)
	})

	return jobID, nil
}

func StopAutoupdate(stackID portainer.StackID, jobID string, scheduler *scheduler.Scheduler) {
	if jobID == "" {
		return
	}

	if err := scheduler.StopJob(jobID); err != nil {
		log.Warn().Int("stack_id", int(stackID)).Msg("could not stop the job for the stack")
	}
}
