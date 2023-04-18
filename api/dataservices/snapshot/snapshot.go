package snapshot

import (
	portainer "github.com/portainer/portainer/api"
)

const (
	BucketName = "snapshots"
)

type Service struct {
	connection portainer.Connection
}

func (service *Service) BucketName() string {
	return BucketName
}

func NewService(connection portainer.Connection) (*Service, error) {
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

func (service *Service) Snapshot(endpointID portainer.EndpointID) (*portainer.Snapshot, error) {
	var snapshot portainer.Snapshot

	return &snapshot, nil
}

func (service *Service) Snapshots() ([]portainer.Snapshot, error) {
	var snapshots = make([]portainer.Snapshot, 0)

	return snapshots, nil
}

func (service *Service) UpdateSnapshot(snapshot *portainer.Snapshot) error {
	// identifier := service.connection.ConvertToKey(int(snapshot.EndpointID))
	// return service.connection.UpdateObject(BucketName, identifier, snapshot)
	return nil
}

func (service *Service) DeleteSnapshot(endpointID portainer.EndpointID) error {
	// identifier := service.connection.ConvertToKey(int(endpointID))
	// return service.connection.DeleteObject(BucketName, identifier)
	return nil
}

func (service *Service) Create(snapshot *portainer.Snapshot) error {
	// return service.connection.CreateObjectWithId(BucketName, int(snapshot.EndpointID), snapshot)
	return nil
}
