package edgeupdateschedule

import (
	"fmt"

	portainer "github.com/portainer/portainer/api"
	"github.com/sirupsen/logrus"
)

const (
	// BucketName represents the name of the bucket where this service stores data.
	BucketName = "edge_update_schedule"
)

// Service represents a service for managing Edge Update Schedule data.
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

// List return an array containing all the items in the bucket.
func (service *Service) List() ([]portainer.EdgeUpdateSchedule, error) {
	var list = make([]portainer.EdgeUpdateSchedule, 0)

	err := service.connection.GetAll(
		BucketName,
		&portainer.EdgeUpdateSchedule{},
		func(obj interface{}) (interface{}, error) {
			item, ok := obj.(*portainer.EdgeUpdateSchedule)
			if !ok {
				logrus.WithField("obj", obj).Errorf("Failed to convert to EdgeUpdateSchedule object")
				return nil, fmt.Errorf("Failed to convert to EdgeUpdateSchedule object: %s", obj)
			}
			list = append(list, *item)
			return &portainer.EdgeUpdateSchedule{}, nil
		})

	return list, err
}

// Item returns a item by ID.
func (service *Service) Item(ID portainer.EdgeUpdateScheduleID) (*portainer.EdgeUpdateSchedule, error) {
	var item portainer.EdgeUpdateSchedule
	identifier := service.connection.ConvertToKey(int(ID))

	err := service.connection.GetObject(BucketName, identifier, &item)
	if err != nil {
		return nil, err
	}

	return &item, nil
}

// Create assign an ID to a new object and saves it.
func (service *Service) Create(item *portainer.EdgeUpdateSchedule) error {
	return service.connection.CreateObject(
		BucketName,
		func(id uint64) (int, interface{}) {
			item.ID = portainer.EdgeUpdateScheduleID(id)
			return int(item.ID), item
		},
	)
}

// Update updates an item.
func (service *Service) Update(ID portainer.EdgeUpdateScheduleID, item *portainer.EdgeUpdateSchedule) error {
	identifier := service.connection.ConvertToKey(int(ID))
	return service.connection.UpdateObject(BucketName, identifier, item)
}

// Delete deletes an item.
func (service *Service) Delete(ID portainer.EdgeUpdateScheduleID) error {
	identifier := service.connection.ConvertToKey(int(ID))
	return service.connection.DeleteObject(BucketName, identifier)
}
