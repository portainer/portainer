package tag

import (
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
)

const (
	// BucketName represents the name of the bucket where this service stores data.
	BucketName = "tags"
)

// Service represents a service for managing environment(endpoint) data.
type Service struct {
	dataservices.BaseDataService[portainer.Tag, portainer.TagID]
}

// NewService creates a new instance of a service.
func NewService(connection portainer.Connection) (*Service, error) {
	err := connection.SetServiceName(BucketName)
	if err != nil {
		return nil, err
	}

	return &Service{
		BaseDataService: dataservices.BaseDataService[portainer.Tag, portainer.TagID]{
			Bucket:     BucketName,
			Connection: connection,
		},
	}, nil
}

func (service *Service) Tx(tx portainer.Transaction) ServiceTx {
	return ServiceTx{
		BaseDataServiceTx: dataservices.BaseDataServiceTx[portainer.Tag, portainer.TagID]{
			Bucket:     BucketName,
			Connection: service.Connection,
			Tx:         tx,
		},
	}
}

// CreateTag creates a new tag.
func (service *Service) Create(tag *portainer.Tag) error {
	return service.Connection.CreateObject(
		BucketName,
		func(id uint64) (int, interface{}) {
			tag.ID = portainer.TagID(id)
			return int(tag.ID), tag
		},
	)
}

// UpdateTagFunc updates a tag inside a transaction avoiding data races.
func (service *Service) UpdateTagFunc(ID portainer.TagID, updateFunc func(tag *portainer.Tag)) error {
	id := service.Connection.ConvertToKey(int(ID))
	tag := &portainer.Tag{}

	return service.Connection.UpdateObjectFunc(BucketName, id, tag, func() {
		updateFunc(tag)
	})
}
