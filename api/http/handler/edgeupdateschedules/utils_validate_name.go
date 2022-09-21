package edgeupdateschedules

import (
	"github.com/pkg/errors"
	"github.com/portainer/portainer/api/edge/updateschedule"
)

const (
	// mustacheUpdateEdgeStackTemplateFile represents the name of the edge stack template file for edge updates
	mustacheUpdateEdgeStackTemplateFile = "edge-update.yml.mustache"
)

func (handler *Handler) validateUniqueName(name string, id updateschedule.UpdateScheduleID) error {
	list, err := handler.updateService.Schedules()
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
