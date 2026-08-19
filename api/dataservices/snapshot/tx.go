package snapshot

import (
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
)

type ServiceTx struct {
	dataservices.BaseDataServiceTx[portainer.Snapshot, portainer.EndpointID]
}

func (service ServiceTx) Create(snapshot *portainer.Snapshot) error {
	return service.Tx.CreateObjectWithId(BucketName, int(snapshot.EndpointID), snapshot)
}

func (service ServiceTx) ReadWithoutSnapshotRaw(ID portainer.EndpointID) (*portainer.Snapshot, error) {
	var snapshot struct {
		Docker *struct {
			X struct{} `json:"DockerSnapshotRaw"`
			*portainer.DockerSnapshot
		} `json:"Docker"`

		portainer.Snapshot
	}

	identifier := service.Connection.ConvertToKey(int(ID))

	if err := service.Tx.GetObject(service.Bucket, identifier, &snapshot); err != nil {
		return nil, err
	}

	if snapshot.Docker != nil {
		snapshot.Snapshot.Docker = snapshot.Docker.DockerSnapshot
	}

	return &snapshot.Snapshot, nil
}

func (service ServiceTx) ReadRawMessage(ID portainer.EndpointID) (*portainer.SnapshotRawMessage, error) {
	var snapshot = portainer.SnapshotRawMessage{}

	identifier := service.Connection.ConvertToKey(int(ID))

	if err := service.Tx.GetObject(service.Bucket, identifier, &snapshot); err != nil {
		return nil, err
	}

	return &snapshot, nil
}

func (service ServiceTx) CreateRawMessage(snapshot *portainer.SnapshotRawMessage) error {
	return service.Tx.CreateObjectWithId(BucketName, int(snapshot.EndpointID), snapshot)
}
