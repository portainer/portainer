package edgeupdateschedules

import (
	"github.com/pkg/errors"
	"github.com/portainer/portainer/api/edgetypes"
)

func (handler *Handler) validateUniqueName(name string, id edgetypes.UpdateScheduleID) error {
	list, err := handler.dataStore.EdgeUpdateSchedule().List()
	if err != nil {
		return errors.WithMessage(err, "Unable to list edge update schedules")
	}

	for _, schedule := range list {
		if id != schedule.ID && schedule.Name == name {
			return errors.New("Edge update schedule name already in use")
		}
	}

	return nil
}
