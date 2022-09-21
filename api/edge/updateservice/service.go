package updateservice

import (
	"sync"

	"github.com/pkg/errors"
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	"github.com/portainer/portainer/api/edge/updateschedule"
	"github.com/rs/zerolog/log"
	"golang.org/x/exp/slices"
)

type Service struct {
	dataStore dataservices.DataStore

	mu                 sync.Mutex
	idxActiveSchedules map[portainer.EndpointID]*updateschedule.EndpointUpdateScheduleRelation
}

func NewService(dataStore dataservices.DataStore) (*Service, error) {
	idxActiveSchedules := map[portainer.EndpointID]*updateschedule.EndpointUpdateScheduleRelation{}

	schedules, err := dataStore.EdgeUpdateSchedule().List()
	if err != nil {
		return nil, errors.WithMessage(err, "Unable to list schedules")
	}

	slices.SortFunc(schedules, func(a updateschedule.UpdateSchedule, b updateschedule.UpdateSchedule) bool {
		return a.Created > b.Created
	})

	for _, schedule := range schedules {
		edgeStack, err := dataStore.EdgeStack().EdgeStack(schedule.EdgeStackID)
		if err != nil {
			return nil, errors.WithMessage(err, "Unable to retrieve edge stack")
		}

		for endpointId := range schedule.EnvironmentsPreviousVersions {
			if idxActiveSchedules[endpointId] != nil {
				continue
			}

			// check if schedule is active
			status := edgeStack.Status[endpointId]
			if status.Type == portainer.EdgeStackStatusPending || status.Type == portainer.StatusAcknowledged {
				idxActiveSchedules[endpointId] = &updateschedule.EndpointUpdateScheduleRelation{
					EnvironmentID: endpointId,
					ScheduleID:    schedule.ID,
					TargetVersion: schedule.Version,
					EdgeStackID:   schedule.EdgeStackID,
				}
			}
		}
	}

	return &Service{
		dataStore:          dataStore,
		idxActiveSchedules: idxActiveSchedules,
	}, nil
}

func (service *Service) ActiveSchedule(environmentID portainer.EndpointID) *updateschedule.EndpointUpdateScheduleRelation {
	service.mu.Lock()
	defer service.mu.Unlock()

	return service.idxActiveSchedules[environmentID]
}

func (service *Service) ActiveSchedules(environmentsIDs []portainer.EndpointID) []updateschedule.EndpointUpdateScheduleRelation {
	service.mu.Lock()
	defer service.mu.Unlock()

	schedules := []updateschedule.EndpointUpdateScheduleRelation{}

	for _, environmentID := range environmentsIDs {
		if s, ok := service.idxActiveSchedules[environmentID]; ok {
			schedules = append(schedules, *s)
		}
	}

	return schedules
}

func (service *Service) RemoveActiveSchedule(environmentID portainer.EndpointID, scheduleID updateschedule.UpdateScheduleID) error {
	service.mu.Lock()
	defer service.mu.Unlock()

	activeSchedule := service.idxActiveSchedules[environmentID]
	if activeSchedule == nil {
		return nil
	}

	if activeSchedule.ScheduleID != scheduleID {
		return errors.New("cannot remove active schedule for environment: schedule ID mismatch")
	}

	delete(service.idxActiveSchedules, environmentID)

	log.Debug().
		Int("schedule-id", int(scheduleID)).
		Int("environment-id", int(environmentID)).
		Msg("removing active schedule")

	return nil
}

func (service *Service) Schedules() ([]updateschedule.UpdateSchedule, error) {
	return service.dataStore.EdgeUpdateSchedule().List()
}

func (service *Service) Schedule(scheduleID updateschedule.UpdateScheduleID) (*updateschedule.UpdateSchedule, error) {
	return service.dataStore.EdgeUpdateSchedule().Item(scheduleID)
}

func (service *Service) CreateSchedule(schedule *updateschedule.UpdateSchedule) error {
	if service.hasActiveSchedule(schedule) {
		return errors.New("Cannot create a new schedule while another schedule is active")
	}

	err := service.dataStore.EdgeUpdateSchedule().Create(schedule)
	if err != nil {
		return err
	}

	service.setRelation(schedule)

	return nil
}

func (service *Service) UpdateSchedule(id updateschedule.UpdateScheduleID, item *updateschedule.UpdateSchedule) error {
	if service.hasActiveSchedule(item) {
		return errors.New("Cannot update a schedule while another schedule is active")
	}

	err := service.dataStore.EdgeUpdateSchedule().Update(id, item)
	if err != nil {
		return err
	}
	service.cleanRelation(id)

	service.setRelation(item)

	return nil
}

func (service *Service) DeleteSchedule(id updateschedule.UpdateScheduleID) error {
	service.cleanRelation(id)

	return service.dataStore.EdgeUpdateSchedule().Delete(id)
}

func (service *Service) cleanRelation(id updateschedule.UpdateScheduleID) {
	service.mu.Lock()
	defer service.mu.Unlock()

	endpointsToClear := []portainer.EndpointID{}
	for endpointId, schedule := range service.idxActiveSchedules {
		if schedule.ScheduleID == id {
			endpointsToClear = append(endpointsToClear, endpointId)
		}
	}

	for _, endpointId := range endpointsToClear {
		delete(service.idxActiveSchedules, endpointId)
	}
}

func (service *Service) hasActiveSchedule(item *updateschedule.UpdateSchedule) bool {
	service.mu.Lock()
	defer service.mu.Unlock()
	for endpointId := range item.EnvironmentsPreviousVersions {
		if service.idxActiveSchedules[endpointId] != nil && service.idxActiveSchedules[endpointId].ScheduleID != item.ID {
			return true
		}
	}

	return false
}

func (service *Service) setRelation(item *updateschedule.UpdateSchedule) {
	service.mu.Lock()
	defer service.mu.Unlock()

	for endpointId := range item.EnvironmentsPreviousVersions {
		service.idxActiveSchedules[endpointId] = &updateschedule.EndpointUpdateScheduleRelation{
			EnvironmentID: endpointId,
			ScheduleID:    item.ID,
			TargetVersion: item.Version,
			EdgeStackID:   item.EdgeStackID,
		}
	}
}
