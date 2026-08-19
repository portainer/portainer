package snapshot

import (
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
)

const BucketName = "snapshots"

type Service struct {
	dataservices.BaseDataService[portainer.Snapshot, portainer.EndpointID]
}

func NewService(connection portainer.Connection) (*Service, error) {
	err := connection.SetServiceName(BucketName)
	if err != nil {
		return nil, err
	}

	return &Service{
		BaseDataService: dataservices.BaseDataService[portainer.Snapshot, portainer.EndpointID]{
			Bucket:     BucketName,
			Connection: connection,
		},
	}, nil
}

func (service *Service) Tx(tx portainer.Transaction) ServiceTx {
	return ServiceTx{
		BaseDataServiceTx: dataservices.BaseDataServiceTx[portainer.Snapshot, portainer.EndpointID]{
			Bucket:     BucketName,
			Connection: service.Connection,
			Tx:         tx,
		},
	}
}

func (service *Service) Create(snapshot *portainer.Snapshot) error {
	return service.Connection.CreateObjectWithId(BucketName, int(snapshot.EndpointID), snapshot)
}

func (service *Service) ReadWithoutSnapshotRaw(ID portainer.EndpointID) (*portainer.Snapshot, error) {
	var snapshot *portainer.Snapshot

	err := service.Connection.ViewTx(func(tx portainer.Transaction) error {
		var err error
		snapshot, err = service.Tx(tx).ReadWithoutSnapshotRaw(ID)

		return err
	})

	return snapshot, err
}

func (service *Service) ReadRawMessage(ID portainer.EndpointID) (*portainer.SnapshotRawMessage, error) {
	var snapshot *portainer.SnapshotRawMessage

	err := service.Connection.ViewTx(func(tx portainer.Transaction) error {
		var err error
		snapshot, err = service.Tx(tx).ReadRawMessage(ID)

		return err
	})

	return snapshot, err
}

func (service *Service) CreateRawMessage(snapshot *portainer.SnapshotRawMessage) error {
	return service.Connection.CreateObjectWithId(BucketName, int(snapshot.EndpointID), snapshot)
}
