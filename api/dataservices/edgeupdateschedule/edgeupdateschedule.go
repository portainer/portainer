package edgeupdateschedule

import (
	"fmt"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/edgetypes"
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
func (service *Service) List() ([]edgetypes.UpdateSchedule, error) {
	var list = make([]edgetypes.UpdateSchedule, 0)

	err := service.connection.GetAll(
		BucketName,
		&edgetypes.UpdateSchedule{},
		func(obj interface{}) (interface{}, error) {
			item, ok := obj.(*edgetypes.UpdateSchedule)
			if !ok {
				logrus.WithField("obj", obj).Errorf("Failed to convert to EdgeUpdateSchedule object")
				return nil, fmt.Errorf("Failed to convert to EdgeUpdateSchedule object: %s", obj)
			}
			list = append(list, *item)
			return &edgetypes.UpdateSchedule{}, nil
		})

	return list, err
}

// Item returns a item by ID.
func (service *Service) Item(ID edgetypes.UpdateScheduleID) (*edgetypes.UpdateSchedule, error) {
	var item edgetypes.UpdateSchedule
	identifier := service.connection.ConvertToKey(int(ID))

	err := service.connection.GetObject(BucketName, identifier, &item)
	if err != nil {
		return nil, err
	}

	return &item, nil
}

// Create assign an ID to a new object and saves it.
func (service *Service) Create(item *edgetypes.UpdateSchedule) error {
	return service.connection.CreateObject(
		BucketName,
		func(id uint64) (int, interface{}) {
			item.ID = edgetypes.UpdateScheduleID(id)
			return int(item.ID), item
		},
	)
}

// Update updates an item.
func (service *Service) Update(ID edgetypes.UpdateScheduleID, item *edgetypes.UpdateSchedule) error {
	identifier := service.connection.ConvertToKey(int(ID))
	return service.connection.UpdateObject(BucketName, identifier, item)
}

// Delete deletes an item.
func (service *Service) Delete(ID edgetypes.UpdateScheduleID) error {
	identifier := service.connection.ConvertToKey(int(ID))
	return service.connection.DeleteObject(BucketName, identifier)
}
