package edgegroup

import (
	portainer "github.com/portainer/portainer/api"
)

// BucketName represents the name of the bucket where this service stores data.
const BucketName = "edgegroups"

// Service represents a service for managing Edge group data.
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

// EdgeGroups return a slice containing all the Edge groups.
func (service *Service) EdgeGroups() ([]portainer.EdgeGroup, error) {
	var groups []portainer.EdgeGroup
	var err error

	err = service.connection.ViewTx(func(tx portainer.Transaction) error {
		groups, err = service.Tx(tx).EdgeGroups()
		return err
	})

	return groups, err
}

// EdgeGroup returns an Edge group by ID.
func (service *Service) EdgeGroup(ID portainer.EdgeGroupID) (*portainer.EdgeGroup, error) {
	var group *portainer.EdgeGroup
	var err error

	err = service.connection.ViewTx(func(tx portainer.Transaction) error {
		group, err = service.Tx(tx).EdgeGroup(ID)
		return err
	})

	return group, err
}

// UpdateEdgeGroup updates an edge group.
func (service *Service) UpdateEdgeGroup(ID portainer.EdgeGroupID, group *portainer.EdgeGroup) error {
	identifier := service.connection.ConvertToKey(int(ID))
	return service.connection.UpdateObject(BucketName, identifier, group)
}

// Deprecated: UpdateEdgeGroupFunc updates an edge group inside a transaction avoiding data races.
func (service *Service) UpdateEdgeGroupFunc(ID portainer.EdgeGroupID, updateFunc func(edgeGroup *portainer.EdgeGroup)) error {
	id := service.connection.ConvertToKey(int(ID))
	edgeGroup := &portainer.EdgeGroup{}

	return service.connection.UpdateObjectFunc(BucketName, id, edgeGroup, func() {
		updateFunc(edgeGroup)
	})
}

// DeleteEdgeGroup deletes an Edge group.
func (service *Service) DeleteEdgeGroup(ID portainer.EdgeGroupID) error {
	return service.connection.UpdateTx(func(tx portainer.Transaction) error {
		return service.Tx(tx).DeleteEdgeGroup(ID)
	})
}

// CreateEdgeGroup assign an ID to a new Edge group and saves it.
func (service *Service) Create(group *portainer.EdgeGroup) error {
	return service.connection.UpdateTx(func(tx portainer.Transaction) error {
		return service.Tx(tx).Create(group)
	})
}
