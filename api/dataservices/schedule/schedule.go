package schedule

import (
	portainer "github.com/portainer/portainer/api"
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
	// err := connection.SetServiceName(BucketName)
	// if err != nil {
	// 	return nil, err
	// }

	return &Service{
		connection: connection,
	}, nil
}

// Schedule returns a schedule by ID.
func (service *Service) Schedule(ID portainer.ScheduleID) (*portainer.Schedule, error) {
	var schedule portainer.Schedule
	// identifier := service.connection.ConvertToKey(int(ID))

	// err := service.connection.GetObject(BucketName, identifier, &schedule)
	// if err != nil {
	// 	return nil, err
	// }

	return &schedule, nil
}

// UpdateSchedule updates a schedule.
func (service *Service) UpdateSchedule(ID portainer.ScheduleID, schedule *portainer.Schedule) error {
	// identifier := service.connection.ConvertToKey(int(ID))
	// return service.connection.UpdateObject(BucketName, identifier, schedule)
	return nil
}

// DeleteSchedule deletes a schedule.
func (service *Service) DeleteSchedule(ID portainer.ScheduleID) error {
	return nil
}

// Schedules return a array containing all the schedules.
func (service *Service) Schedules() ([]portainer.Schedule, error) {
	var schedules = make([]portainer.Schedule, 0)

	return schedules, nil
}

// SchedulesByJobType return a array containing all the schedules
// with the specified JobType.
func (service *Service) SchedulesByJobType(jobType portainer.JobType) ([]portainer.Schedule, error) {
	var schedules = make([]portainer.Schedule, 0)

	return schedules, nil
}

// Create assign an ID to a new schedule and saves it.
func (service *Service) CreateSchedule(schedule *portainer.Schedule) error {
	return nil
}

// GetNextIdentifier returns the next identifier for a schedule.
func (service *Service) GetNextIdentifier() int {
	return 0
}
