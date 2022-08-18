package edgeupdateschedules

import "github.com/pkg/errors"

func (handler *Handler) validateUniqueName(name string) error {
	list, err := handler.dataStore.EdgeUpdateSchedule().List()
	if err != nil {
		return errors.WithMessage(err, "Unable to list edge update schedules")
	}

	for _, schedule := range list {
		if schedule.Name == name {
			return errors.New("Edge update schedule name already in use")
		}
	}

	return nil
}
