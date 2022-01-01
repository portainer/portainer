package stacks

import (
	"time"

	"github.com/pkg/errors"
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	"github.com/portainer/portainer/api/scheduler"
)

func StartStackSchedules(scheduler *scheduler.Scheduler, stackdeployer StackDeployer, datastore dataservices.DataStore, gitService portainer.GitService) error {
	stacks, err := datastore.Stack().RefreshableStacks()
	if err != nil {
		return errors.Wrap(err, "failed to fetch refreshable stacks")
	}
	for _, stack := range stacks {
		d, err := time.ParseDuration(stack.AutoUpdate.Interval)
		if err != nil {
			return errors.Wrap(err, "Unable to parse auto update interval")
		}
		stackID := stack.ID // to be captured by the scheduled function
		jobID := scheduler.StartJobEvery(d, func() error {
			return RedeployWhenChanged(stackID, stackdeployer, datastore, gitService)
		})

		stack.AutoUpdate.JobID = jobID
		if err := datastore.Stack().UpdateStack(stack.ID, &stack); err != nil {
			return errors.Wrap(err, "failed to update stack job id")
		}
	}
	return nil
}
