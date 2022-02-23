package schedule

import (
	"fmt"
	"github.com/portainer/portainer/api/database"

	"github.com/sirupsen/logrus"
)

const (
	// BucketName represents the name of the bucket where this service stores data.
	BucketName = "schedules"
)

// Service represents a service for managing schedule data.
type Service struct {
	connection database.Connection
}

func (service *Service) BucketName() string {
	return BucketName
}

// NewService creates a new instance of a service.
func NewService(connection database.Connection) (*Service, error) {
	err := connection.SetServiceName(BucketName)
	if err != nil {
		return nil, err
	}

	return &Service{
		connection: connection,
	}, nil
}

// Schedule returns a schedule by ID.
func (service *Service) Schedule(ID ScheduleID) (*Schedule, error) {
	var schedule Schedule
	identifier := service.connection.ConvertToKey(int(ID))

	err := service.connection.GetObject(BucketName, identifier, &schedule)
	if err != nil {
		return nil, err
	}

	return &schedule, nil
}

// UpdateSchedule updates a schedule.
func (service *Service) UpdateSchedule(ID ScheduleID, schedule *Schedule) error {
	identifier := service.connection.ConvertToKey(int(ID))
	return service.connection.UpdateObject(BucketName, identifier, schedule)
}

// DeleteSchedule deletes a schedule.
func (service *Service) DeleteSchedule(ID ScheduleID) error {
	identifier := service.connection.ConvertToKey(int(ID))
	return service.connection.DeleteObject(BucketName, identifier)
}

// Schedules return a array containing all the schedules.
func (service *Service) Schedules() ([]Schedule, error) {
	var schedules = make([]Schedule, 0)

	err := service.connection.GetAll(
		BucketName,
		&Schedule{},
		func(obj interface{}) (interface{}, error) {
			schedule, ok := obj.(*Schedule)
			if !ok {
				logrus.WithField("obj", obj).Errorf("Failed to convert to Schedule object")
				return nil, fmt.Errorf("Failed to convert to Schedule object: %s", obj)
			}
			schedules = append(schedules, *schedule)
			return &Schedule{}, nil
		})

	return schedules, err
}

// SchedulesByJobType return a array containing all the schedules
// with the specified JobType.
func (service *Service) SchedulesByJobType(jobType JobType) ([]Schedule, error) {
	var schedules = make([]Schedule, 0)

	err := service.connection.GetAll(
		BucketName,
		&Schedule{},
		func(obj interface{}) (interface{}, error) {
			schedule, ok := obj.(*Schedule)
			if !ok {
				logrus.WithField("obj", obj).Errorf("Failed to convert to Schedule object")
				return nil, fmt.Errorf("Failed to convert to Schedule object: %s", obj)
			}
			if schedule.JobType == jobType {
				schedules = append(schedules, *schedule)
			}
			return &Schedule{}, nil
		})

	return schedules, err
}

// Create assign an ID to a new schedule and saves it.
func (service *Service) CreateSchedule(schedule *Schedule) error {
	return service.connection.CreateObjectWithSetSequence(BucketName, int(schedule.ID), schedule)
}

// GetNextIdentifier returns the next identifier for a schedule.
func (service *Service) GetNextIdentifier() int {
	return service.connection.GetNextIdentifier(BucketName)
}

// Schedule represents a scheduled job.
// It only contains a pointer to one of the JobRunner implementations
// based on the JobType.
// NOTE: The Recurring option is only used by ScriptExecutionJob at the moment
// Deprecated in favor of EdgeJob
type Schedule struct {
	// Schedule Identifier
	ID             ScheduleID `json:"Id" example:"1"`
	Name           string
	CronExpression string
	Recurring      bool
	Created        int64
	JobType        JobType
	EdgeSchedule   *EdgeSchedule
}

// EdgeSchedule represents a scheduled job that can run on Edge environments(endpoints).
// Deprecated in favor of EdgeJob
type EdgeSchedule struct {
	// EdgeSchedule Identifier
	ID             ScheduleID            `json:"Id" example:"1"`
	CronExpression string                `json:"CronExpression"`
	Script         string                `json:"Script"`
	Version        int                   `json:"Version"`
	Endpoints      []database.EndpointID `json:"Endpoints"`
}

// ScheduleID represents a schedule identifier.
// Deprecated in favor of EdgeJob
type ScheduleID int

// JobType represents a job type
type JobType int

const (
	_ JobType = iota
	// SnapshotJobType is a system job used to create environment(endpoint) snapshots
	SnapshotJobType = 2
)
