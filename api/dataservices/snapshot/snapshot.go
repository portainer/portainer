package snapshot

import (
	"fmt"

	portainer "github.com/portainer/portainer/api"
	"github.com/sirupsen/logrus"
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
	err := connection.SetServiceName(BucketName)
	if err != nil {
		return nil, err
	}

	return &Service{
		connection: connection,
	}, nil
}

func (service *Service) Snapshot(endpointID portainer.EndpointID) (*portainer.Snapshot, error) {
	var snapshot portainer.Snapshot
	identifier := service.connection.ConvertToKey(int(endpointID))

	err := service.connection.GetObject(BucketName, identifier, &snapshot)
	if err != nil {
		return nil, err
	}

	return &snapshot, nil
}

func (service *Service) Snapshots() ([]portainer.Snapshot, error) {
	var snapshots = make([]portainer.Snapshot, 0)

	err := service.connection.GetAllWithJsoniter(
		BucketName,
		&portainer.Snapshot{},
		func(obj interface{}) (interface{}, error) {
			snapshot, ok := obj.(*portainer.Snapshot)
			if !ok {
				logrus.WithField("obj", obj).Errorf("Failed to convert to Snapshot object")
				return nil, fmt.Errorf("failed to convert to Snapshot object: %s", obj)
			}
			snapshots = append(snapshots, *snapshot)
			return &portainer.Snapshot{}, nil
		})

	return snapshots, err
}

func (service *Service) UpdateSnapshot(snapshot *portainer.Snapshot) error {
	identifier := service.connection.ConvertToKey(int(snapshot.EndpointID))
	return service.connection.UpdateObject(BucketName, identifier, snapshot)
}

func (service *Service) DeleteSnapshot(endpointID portainer.EndpointID) error {
	identifier := service.connection.ConvertToKey(int(endpointID))
	return service.connection.DeleteObject(BucketName, identifier)
}

func (service *Service) Create(snapshot *portainer.Snapshot) error {
	return service.connection.CreateObjectWithId(BucketName, int(snapshot.EndpointID), snapshot)
}
