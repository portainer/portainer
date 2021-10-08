package edgejob

import (
	"fmt"
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/bolt/internal"
	"github.com/sirupsen/logrus"
)

const (
	// BucketName represents the name of the bucket where this service stores data.
	BucketName = "edgejobs"
)

// Service represents a service for managing edge jobs data.
type Service struct {
	connection *internal.DbConnection
}

// NewService creates a new instance of a service.
func NewService(connection *internal.DbConnection) (*Service, error) {
	err := internal.CreateBucket(connection, BucketName)
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

	err := internal.GetAll(
		service.connection,
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
	identifier := internal.Itob(int(ID))

	err := internal.GetObject(service.connection, BucketName, identifier, &edgeJob)
	if err != nil {
		return nil, err
	}

	return &edgeJob, nil
}

// CreateEdgeJob creates a new Edge job
func (service *Service) Create(edgeJob *portainer.EdgeJob) error {
	return internal.CreateObject(
		service.connection,
		BucketName,
		func(id uint64) (int, interface{}) {
			edgeJob.ID = portainer.EdgeJobID(id)
			return int(edgeJob.ID), edgeJob
		},
	)
}

// UpdateEdgeJob updates an Edge job by ID
func (service *Service) UpdateEdgeJob(ID portainer.EdgeJobID, edgeJob *portainer.EdgeJob) error {
	identifier := internal.Itob(int(ID))
	return internal.UpdateObject(service.connection, BucketName, identifier, edgeJob)
}

// DeleteEdgeJob deletes an Edge job
func (service *Service) DeleteEdgeJob(ID portainer.EdgeJobID) error {
	identifier := internal.Itob(int(ID))
	return internal.DeleteObject(service.connection, BucketName, identifier)
}

// GetNextIdentifier returns the next identifier for an environment(endpoint).
func (service *Service) GetNextIdentifier() int {
	return internal.GetNextIdentifier(service.connection, BucketName)
}
