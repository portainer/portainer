package edgeupdateschedule

import (
	"fmt"
	"sync"

	"github.com/pkg/errors"
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/edgetypes"
	"github.com/sirupsen/logrus"
)

const (
	// BucketName represents the name of the bucket where this service stores data.
	BucketName = "edge_update_schedule"
)

// Service represents a service for managing Edge Update Schedule data.
type Service struct {
	connection portainer.Connection

	mu                 sync.Mutex
	idxActiveSchedules map[portainer.EndpointID]*edgetypes.EndpointUpdateScheduleRelation
}

func (service *Service) BucketName() string {
	return BucketName
}

// NewService creates a new instance of a service.
func NewService(connection portainer.Connection) (*Service, error) {
	err := connection.SetServiceName(BucketName)
	if err != nil {
		return nil, err
	}

	service := &Service{
		connection: connection,
	}

	service.idxActiveSchedules = map[portainer.EndpointID]*edgetypes.EndpointUpdateScheduleRelation{}

	schedules, err := service.List()
	if err != nil {
		return nil, errors.WithMessage(err, "Unable to list schedules")
	}

	for _, schedule := range schedules {
		service.setRelation(&schedule)
	}

	return service, nil
}

func (service *Service) ActiveSchedule(environmentID portainer.EndpointID) *edgetypes.EndpointUpdateScheduleRelation {
	service.mu.Lock()
	defer service.mu.Unlock()

	return service.idxActiveSchedules[environmentID]
}

func (service *Service) ActiveSchedules(environmentsIDs []portainer.EndpointID) []edgetypes.EndpointUpdateScheduleRelation {
	service.mu.Lock()
	defer service.mu.Unlock()

	schedules := []edgetypes.EndpointUpdateScheduleRelation{}

	for _, environmentID := range environmentsIDs {
		if s, ok := service.idxActiveSchedules[environmentID]; ok {
			schedules = append(schedules, *s)
		}
	}

	return schedules
}

// List return an array containing all the items in the bucket.
func (service *Service) List() ([]edgetypes.UpdateSchedule, error) {
	var list = make([]edgetypes.UpdateSchedule, 0)

	err := service.connection.GetAll(
		BucketName,
		&edgetypes.UpdateSchedule{},
		func(obj interface{}) (interface{}, error) {
			item, ok := obj.(*edgetypes.UpdateSchedule)
			if !ok {
				logrus.WithField("obj", obj).Errorf("Failed to convert to EdgeUpdateSchedule object")
				return nil, fmt.Errorf("failed to convert to EdgeUpdateSchedule object: %s", obj)
			}
			list = append(list, *item)
			return &edgetypes.UpdateSchedule{}, nil
		})

	return list, err
}

// Item returns a item by ID.
func (service *Service) Item(ID edgetypes.UpdateScheduleID) (*edgetypes.UpdateSchedule, error) {
	var item edgetypes.UpdateSchedule
	identifier := service.connection.ConvertToKey(int(ID))

	err := service.connection.GetObject(BucketName, identifier, &item)
	if err != nil {
		return nil, err
	}

	return &item, nil
}

// Create assign an ID to a new object and saves it.
func (service *Service) Create(item *edgetypes.UpdateSchedule) error {
	err := service.connection.CreateObject(
		BucketName,
		func(id uint64) (int, interface{}) {
			item.ID = edgetypes.UpdateScheduleID(id)
			return int(item.ID), item
		},
	)

	if err != nil {
		return err
	}

	return service.setRelation(item)
}

// Update updates an item.
func (service *Service) Update(id edgetypes.UpdateScheduleID, item *edgetypes.UpdateSchedule) error {
	identifier := service.connection.ConvertToKey(int(id))
	err := service.connection.UpdateObject(BucketName, identifier, item)
	if err != nil {
		return err
	}

	service.cleanRelation(id)

	return service.setRelation(item)
}

// Delete deletes an item.
func (service *Service) Delete(id edgetypes.UpdateScheduleID) error {

	service.cleanRelation(id)

	identifier := service.connection.ConvertToKey(int(id))
	return service.connection.DeleteObject(BucketName, identifier)
}

func (service *Service) cleanRelation(id edgetypes.UpdateScheduleID) {
	service.mu.Lock()
	defer service.mu.Unlock()

	for _, schedule := range service.idxActiveSchedules {
		if schedule != nil && schedule.ScheduleID == id {
			delete(service.idxActiveSchedules, schedule.EnvironmentID)
		}
	}
}

func (service *Service) setRelation(schedule *edgetypes.UpdateSchedule) error {
	service.mu.Lock()
	defer service.mu.Unlock()

	for environmentID, environmentStatus := range schedule.Status {
		if environmentStatus.Status != edgetypes.UpdateScheduleStatusPending {
			continue
		}

		// this should never happen
		if service.idxActiveSchedules[environmentID] != nil && service.idxActiveSchedules[environmentID].ScheduleID != schedule.ID {
			return errors.New("Multiple schedules are pending for the same environment")
		}

		service.idxActiveSchedules[environmentID] = &edgetypes.EndpointUpdateScheduleRelation{
			EnvironmentID: environmentID,
			ScheduleID:    schedule.ID,
			TargetVersion: environmentStatus.TargetVersion,
			Status:        environmentStatus.Status,
			Error:         environmentStatus.Error,
			Type:          schedule.Type,
		}
	}

	return nil
}
