package edgejob

import (
	"fmt"

	portainer "github.com/portainer/portainer/api"
	"github.com/sirupsen/logrus"
)

const (
	// BucketName represents the name of the bucket where this service stores data.
	BucketName = "edgejobs"
)

// Service represents a service for managing edge jobs data.
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

// EdgeJobs returns a list of Edge jobs
func (service *Service) EdgeJobs() ([]portainer.EdgeJob, error) {
	var edgeJobs = make([]portainer.EdgeJob, 0)

	err := service.connection.GetAll(
		BucketName,
		&portainer.EdgeJob{},
		func(obj interface{}) (interface{}, error) {
			//var tag portainer.Tag
			job, ok := obj.(*portainer.EdgeJob)
			if !ok {
				logrus.WithField("obj", obj).Errorf("Failed to convert to EdgeJob object")
				return nil, fmt.Errorf("Failed to convert to EdgeJob object: %s", obj)
			}
			edgeJobs = append(edgeJobs, *job)
			return &portainer.EdgeJob{}, nil
		})

	return edgeJobs, err
}

// EdgeJob returns an Edge job by ID
func (service *Service) EdgeJob(ID portainer.EdgeJobID) (*portainer.EdgeJob, error) {
	var edgeJob portainer.EdgeJob
	identifier := service.connection.ConvertToKey(int(ID))

	err := service.connection.GetObject(BucketName, identifier, &edgeJob)
	if err != nil {
		return nil, err
	}

	return &edgeJob, nil
}

// Create creates a new EdgeJob
func (service *Service) Create(ID portainer.EdgeJobID, edgeJob *portainer.EdgeJob) error {
	edgeJob.ID = ID

	return service.connection.CreateObjectWithId(
		BucketName,
		int(edgeJob.ID),
		edgeJob,
	)
}

// UpdateEdgeJob updates an Edge job by ID
func (service *Service) UpdateEdgeJob(ID portainer.EdgeJobID, edgeJob *portainer.EdgeJob) error {
	identifier := service.connection.ConvertToKey(int(ID))
	return service.connection.UpdateObject(BucketName, identifier, edgeJob)
}

// DeleteEdgeJob deletes an Edge job
func (service *Service) DeleteEdgeJob(ID portainer.EdgeJobID) error {
	identifier := service.connection.ConvertToKey(int(ID))
	return service.connection.DeleteObject(BucketName, identifier)
}

// GetNextIdentifier returns the next identifier for an environment(endpoint).
func (service *Service) GetNextIdentifier() int {
	return service.connection.GetNextIdentifier(BucketName)
}
