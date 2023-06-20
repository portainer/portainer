package snapshot

import (
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
)

type ServiceTx struct {
	service *Service
	tx      portainer.Transaction
}

func (service ServiceTx) BucketName() string {
	return BucketName
}

func (service ServiceTx) Snapshot(endpointID portainer.EndpointID) (*portainer.Snapshot, error) {
	var snapshot portainer.Snapshot
	identifier := service.service.connection.ConvertToKey(int(endpointID))

	err := service.tx.GetObject(BucketName, identifier, &snapshot)
	if err != nil {
		return nil, err
	}

	return &snapshot, nil
}

func (service ServiceTx) Snapshots() ([]portainer.Snapshot, error) {
	var snapshots = make([]portainer.Snapshot, 0)

	return snapshots, service.tx.GetAllWithJsoniter(
		BucketName,
		&portainer.Snapshot{},
		dataservices.AppendFn(&snapshots),
	)
}

func (service ServiceTx) UpdateSnapshot(snapshot *portainer.Snapshot) error {
	identifier := service.service.connection.ConvertToKey(int(snapshot.EndpointID))
	return service.tx.UpdateObject(BucketName, identifier, snapshot)
}

func (service ServiceTx) DeleteSnapshot(endpointID portainer.EndpointID) error {
	identifier := service.service.connection.ConvertToKey(int(endpointID))
	return service.tx.DeleteObject(BucketName, identifier)
}

func (service ServiceTx) Create(snapshot *portainer.Snapshot) error {
	return service.tx.CreateObjectWithId(BucketName, int(snapshot.EndpointID), snapshot)
}
