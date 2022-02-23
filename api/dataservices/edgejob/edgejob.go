package edgejob

import (
	"fmt"
	"github.com/portainer/portainer/api/database"
	"github.com/sirupsen/logrus"
)

const (
	// BucketName represents the name of the bucket where this service stores data.
	BucketName = "edgejobs"
)

// Service represents a service for managing edge jobs data.
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

// EdgeJobs returns a list of Edge jobs
func (service *Service) EdgeJobs() ([]EdgeJob, error) {
	var edgeJobs = make([]EdgeJob, 0)

	err := service.connection.GetAll(
		BucketName,
		&EdgeJob{},
		func(obj interface{}) (interface{}, error) {
			//var tag portainer.Tag
			job, ok := obj.(*EdgeJob)
			if !ok {
				logrus.WithField("obj", obj).Errorf("Failed to convert to EdgeJob object")
				return nil, fmt.Errorf("Failed to convert to EdgeJob object: %s", obj)
			}
			edgeJobs = append(edgeJobs, *job)
			return &EdgeJob{}, nil
		})

	return edgeJobs, err
}

// EdgeJob returns an Edge job by ID
func (service *Service) EdgeJob(ID EdgeJobID) (*EdgeJob, error) {
	var edgeJob EdgeJob
	identifier := service.connection.ConvertToKey(int(ID))

	err := service.connection.GetObject(BucketName, identifier, &edgeJob)
	if err != nil {
		return nil, err
	}

	return &edgeJob, nil
}

// CreateEdgeJob creates a new Edge job
func (service *Service) Create(edgeJob *EdgeJob) error {
	return service.connection.CreateObject(
		BucketName,
		func(id uint64) (int, interface{}) {
			edgeJob.ID = EdgeJobID(id)
			return int(edgeJob.ID), edgeJob
		},
	)
}

// UpdateEdgeJob updates an Edge job by ID
func (service *Service) UpdateEdgeJob(ID EdgeJobID, edgeJob *EdgeJob) error {
	identifier := service.connection.ConvertToKey(int(ID))
	return service.connection.UpdateObject(BucketName, identifier, edgeJob)
}

// DeleteEdgeJob deletes an Edge job
func (service *Service) DeleteEdgeJob(ID EdgeJobID) error {
	identifier := service.connection.ConvertToKey(int(ID))
	return service.connection.DeleteObject(BucketName, identifier)
}

// GetNextIdentifier returns the next identifier for an environment(endpoint).
func (service *Service) GetNextIdentifier() int {
	return service.connection.GetNextIdentifier(BucketName)
}

// EdgeJob represents a job that can run on Edge environments(endpoints).
type EdgeJob struct {
	// EdgeJob Identifier
	ID             EdgeJobID                                   `json:"Id" example:"1"`
	Created        int64                                       `json:"Created"`
	CronExpression string                                      `json:"CronExpression"`
	Endpoints      map[database.EndpointID]EdgeJobEndpointMeta `json:"Endpoints"`
	Name           string                                      `json:"Name"`
	ScriptPath     string                                      `json:"ScriptPath"`
	Recurring      bool                                        `json:"Recurring"`
	Version        int                                         `json:"Version"`
}

// EdgeJobEndpointMeta represents a meta data object for an Edge job and Environment(Endpoint) relation
type EdgeJobEndpointMeta struct {
	LogsStatus  EdgeJobLogsStatus
	CollectLogs bool
}

// EdgeJobID represents an Edge job identifier
type EdgeJobID int

// EdgeJobLogsStatus represent status of logs collection job
type EdgeJobLogsStatus int
