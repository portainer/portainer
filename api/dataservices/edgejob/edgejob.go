package edgejob

import (
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
)

// BucketName represents the name of the bucket where this service stores data.
const BucketName = "edgejobs"

// Service represents a service for managing edge jobs data.
type Service struct {
	dataservices.BaseDataService[portainer.EdgeJob, portainer.EdgeJobID]
}

// NewService creates a new instance of a service.
func NewService(connection portainer.Connection) (*Service, error) {
	err := connection.SetServiceName(BucketName)
	if err != nil {
		return nil, err
	}

	return &Service{
		BaseDataService: dataservices.BaseDataService[portainer.EdgeJob, portainer.EdgeJobID]{
			Bucket:     BucketName,
			Connection: connection,
		},
	}, nil
}

func (service *Service) Tx(tx portainer.Transaction) ServiceTx {
	return ServiceTx{
		BaseDataServiceTx: dataservices.BaseDataServiceTx[portainer.EdgeJob, portainer.EdgeJobID]{
			Bucket:     BucketName,
			Connection: service.Connection,
			Tx:         tx,
		},
	}
}

// Create creates a new EdgeJob
func (service *Service) Create(edgeJob *portainer.EdgeJob) error {
	return service.CreateWithID(portainer.EdgeJobID(service.GetNextIdentifier()), edgeJob)
}

// CreateWithID creates a new EdgeJob
func (service *Service) CreateWithID(ID portainer.EdgeJobID, edgeJob *portainer.EdgeJob) error {
	edgeJob.ID = ID

	return service.Connection.CreateObjectWithId(
		BucketName,
		int(edgeJob.ID),
		edgeJob,
	)
}

// UpdateEdgeJobFunc updates an edge job inside a transaction avoiding data races.
func (service *Service) UpdateEdgeJobFunc(ID portainer.EdgeJobID, updateFunc func(edgeJob *portainer.EdgeJob)) error {
	id := service.Connection.ConvertToKey(int(ID))
	edgeJob := &portainer.EdgeJob{}

	return service.Connection.UpdateObjectFunc(BucketName, id, edgeJob, func() {
		updateFunc(edgeJob)
	})
}

// GetNextIdentifier returns the next identifier for an environment(endpoint).
func (service *Service) GetNextIdentifier() int {
	return service.Connection.GetNextIdentifier(BucketName)
}
