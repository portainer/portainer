package schedule

import (
	"fmt"

	portainer "github.com/portainer/portainer/api"
	"github.com/sirupsen/logrus"
)

const (
	// BucketName represents the name of the bucket where this service stores data.
	BucketName = "schedules"
)

// Service represents a service for managing schedule data.
type Service struct {
	connection portainer.Connection
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

	return &Service{
		connection: connection,
	}, nil
}

// Schedule returns a schedule by ID.
func (service *Service) Schedule(ID portainer.ScheduleID) (*portainer.Schedule, error) {
	var schedule portainer.Schedule
	identifier := service.connection.ConvertToKey(int(ID))

	err := service.connection.GetObject(BucketName, identifier, &schedule)
	if err != nil {
		return nil, err
	}

	return &schedule, nil
}

// UpdateSchedule updates a schedule.
func (service *Service) UpdateSchedule(ID portainer.ScheduleID, schedule *portainer.Schedule) error {
	identifier := service.connection.ConvertToKey(int(ID))
	return service.connection.UpdateObject(BucketName, identifier, schedule)
}

// DeleteSchedule deletes a schedule.
func (service *Service) DeleteSchedule(ID portainer.ScheduleID) error {
	identifier := service.connection.ConvertToKey(int(ID))
	return service.connection.DeleteObject(BucketName, identifier)
}

// Schedules return a array containing all the schedules.
func (service *Service) Schedules() ([]portainer.Schedule, error) {
	var schedules = make([]portainer.Schedule, 0)

	err := service.connection.GetAll(
		BucketName,
		&portainer.Schedule{},
		func(obj interface{}) (interface{}, error) {
			schedule, ok := obj.(*portainer.Schedule)
			if !ok {
				logrus.WithField("obj", obj).Errorf("Failed to convert to Schedule object")
				return nil, fmt.Errorf("Failed to convert to Schedule object: %s", obj)
			}
			schedules = append(schedules, *schedule)
			return &portainer.Schedule{}, nil
		})

	return schedules, err
}

// SchedulesByJobType return a array containing all the schedules
// with the specified JobType.
func (service *Service) SchedulesByJobType(jobType portainer.JobType) ([]portainer.Schedule, error) {
	var schedules = make([]portainer.Schedule, 0)

	err := service.connection.GetAll(
		BucketName,
		&portainer.Schedule{},
		func(obj interface{}) (interface{}, error) {
			schedule, ok := obj.(*portainer.Schedule)
			if !ok {
				logrus.WithField("obj", obj).Errorf("Failed to convert to Schedule object")
				return nil, fmt.Errorf("Failed to convert to Schedule object: %s", obj)
			}
			if schedule.JobType == jobType {
				schedules = append(schedules, *schedule)
			}
			return &portainer.Schedule{}, nil
		})

	return schedules, err
}

// Create assign an ID to a new schedule and saves it.
func (service *Service) CreateSchedule(schedule *portainer.Schedule) error {
	return service.connection.CreateObjectWithSetSequence(BucketName, int(schedule.ID), schedule)
}

// GetNextIdentifier returns the next identifier for a schedule.
func (service *Service) GetNextIdentifier() int {
	return service.connection.GetNextIdentifier(BucketName)
}
