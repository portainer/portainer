package edgejob

import (
	"fmt"

	portainer "github.com/portainer/portainer/api"

	"github.com/rs/zerolog/log"
)

// BucketName represents the name of the bucket where this service stores data.
const BucketName = "edgejobs"

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

func (service *Service) Tx(tx portainer.Transaction) ServiceTx {
	return ServiceTx{
		service: service,
		tx:      tx,
	}
}

// EdgeJobs returns a list of Edge jobs
func (service *Service) EdgeJobs() ([]portainer.EdgeJob, error) {
	var edgeJobs = make([]portainer.EdgeJob, 0)

	err := service.connection.GetAll(
		BucketName,
		&portainer.EdgeJob{},
		func(obj interface{}) (interface{}, error) {
			job, ok := obj.(*portainer.EdgeJob)
			if !ok {
				log.Debug().Str("obj", fmt.Sprintf("%#v", obj)).Msg("failed to convert to EdgeJob object")
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

// Deprecated: use UpdateEdgeJobFunc instead
func (service *Service) UpdateEdgeJob(ID portainer.EdgeJobID, edgeJob *portainer.EdgeJob) error {
	identifier := service.connection.ConvertToKey(int(ID))
	return service.connection.UpdateObject(BucketName, identifier, edgeJob)
}

// UpdateEdgeJobFunc updates an edge job inside a transaction avoiding data races.
func (service *Service) UpdateEdgeJobFunc(ID portainer.EdgeJobID, updateFunc func(edgeJob *portainer.EdgeJob)) error {
	id := service.connection.ConvertToKey(int(ID))
	edgeJob := &portainer.EdgeJob{}

	return service.connection.UpdateObjectFunc(BucketName, id, edgeJob, func() {
		updateFunc(edgeJob)
	})
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
