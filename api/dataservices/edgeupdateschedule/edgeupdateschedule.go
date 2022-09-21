package edgeupdateschedule

import (
	"fmt"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/edge/updateschedule"
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

	service := &Service{
		connection: connection,
	}

	return service, nil
}

// List return an array containing all the items in the bucket.
func (service *Service) List() ([]updateschedule.UpdateSchedule, error) {
	var list = make([]updateschedule.UpdateSchedule, 0)

	err := service.connection.GetAll(
		BucketName,
		&updateschedule.UpdateSchedule{},
		func(obj interface{}) (interface{}, error) {
			item, ok := obj.(*updateschedule.UpdateSchedule)
			if !ok {
				logrus.WithField("obj", obj).Errorf("Failed to convert to EdgeUpdateSchedule object")
				return nil, fmt.Errorf("failed to convert to EdgeUpdateSchedule object: %s", obj)
			}
			list = append(list, *item)
			return &updateschedule.UpdateSchedule{}, nil
		})

	return list, err
}

// Item returns an item by ID.
func (service *Service) Item(ID updateschedule.UpdateScheduleID) (*updateschedule.UpdateSchedule, error) {
	var item updateschedule.UpdateSchedule
	identifier := service.connection.ConvertToKey(int(ID))

	err := service.connection.GetObject(BucketName, identifier, &item)
	if err != nil {
		return nil, err
	}

	return &item, nil
}

// Create assign an ID to a new object and saves it.
func (service *Service) Create(item *updateschedule.UpdateSchedule) error {

	return service.connection.CreateObject(
		BucketName,
		func(id uint64) (int, interface{}) {
			item.ID = updateschedule.UpdateScheduleID(id)
			return int(item.ID), item
		},
	)

}

// Update updates an item.
func (service *Service) Update(id updateschedule.UpdateScheduleID, item *updateschedule.UpdateSchedule) error {

	identifier := service.connection.ConvertToKey(int(id))
	return service.connection.UpdateObject(BucketName, identifier, item)

}

// Delete deletes an item.
func (service *Service) Delete(id updateschedule.UpdateScheduleID) error {

	identifier := service.connection.ConvertToKey(int(id))
	return service.connection.DeleteObject(BucketName, identifier)
}
