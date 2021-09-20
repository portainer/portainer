package edgejob

import (
	"github.com/boltdb/bolt"
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/bolt/internal"
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

	err := service.connection.View(func(tx *bolt.Tx) error {
		bucket := tx.Bucket([]byte(BucketName))

		cursor := bucket.Cursor()
		for k, v := cursor.First(); k != nil; k, v = cursor.Next() {
			var edgeJob portainer.EdgeJob
			err := internal.UnmarshalObject(v, &edgeJob)
			if err != nil {
				return err
			}
			edgeJobs = append(edgeJobs, edgeJob)
		}

		return nil
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
func (service *Service) CreateEdgeJob(edgeJob *portainer.EdgeJob) error {
	return service.connection.Update(func(tx *bolt.Tx) error {
		bucket := tx.Bucket([]byte(BucketName))

		if edgeJob.ID == 0 {
			id, _ := bucket.NextSequence()
			edgeJob.ID = portainer.EdgeJobID(id)
		}

		data, err := internal.MarshalObject(edgeJob)
		if err != nil {
			return err
		}

		return bucket.Put(internal.Itob(int(edgeJob.ID)), data)
	})
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
