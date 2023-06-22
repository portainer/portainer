package edgegroup

import (
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
)

// BucketName represents the name of the bucket where this service stores data.
const BucketName = "edgegroups"

// Service represents a service for managing Edge group data.
type Service struct {
	dataservices.BaseDataService[portainer.EdgeGroup, portainer.EdgeGroupID]
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
		BaseDataService: dataservices.BaseDataService[portainer.EdgeGroup, portainer.EdgeGroupID]{
			Bucket:     BucketName,
			Connection: connection,
		},
	}, nil
}

func (service *Service) Tx(tx portainer.Transaction) ServiceTx {
	return ServiceTx{
		BaseDataServiceTx: dataservices.BaseDataServiceTx[portainer.EdgeGroup, portainer.EdgeGroupID]{
			Bucket:     BucketName,
			Connection: service.Connection,
			Tx:         tx,
		},
	}
}

// Deprecated: UpdateEdgeGroupFunc updates an edge group inside a transaction avoiding data races.
func (service *Service) UpdateEdgeGroupFunc(ID portainer.EdgeGroupID, updateFunc func(edgeGroup *portainer.EdgeGroup)) error {
	id := service.Connection.ConvertToKey(int(ID))
	edgeGroup := &portainer.EdgeGroup{}

	return service.Connection.UpdateObjectFunc(BucketName, id, edgeGroup, func() {
		updateFunc(edgeGroup)
	})
}

// CreateEdgeGroup assign an ID to a new Edge group and saves it.
func (service *Service) Create(group *portainer.EdgeGroup) error {
	return service.Connection.UpdateTx(func(tx portainer.Transaction) error {
		return service.Tx(tx).Create(group)
	})
}
