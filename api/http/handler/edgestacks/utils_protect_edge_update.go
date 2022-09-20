package edgestacks

import (
	"github.com/pkg/errors"
	portainer "github.com/portainer/portainer/api"
)

func (handler *Handler) protectUpdateSchedule(edgeStackID portainer.EdgeStackID) error {
	schedules, err := handler.DataStore.EdgeUpdateSchedule().List()
	if err != nil {
		return errors.WithMessage(err, "Unable to retrieve edge update schedules from the database")
	}

	for _, schedule := range schedules {
		if schedule.EdgeStackID == edgeStackID {
			return errors.New("unable to delete edge stack that is used by an edge update schedule")
		}
	}

	return nil
}
