package resourcecontrol

import (
	"fmt"
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/bolt/errors"
	"github.com/portainer/portainer/api/bolt/internal"
	"github.com/sirupsen/logrus"
)

const (
	// BucketName represents the name of the bucket where this service stores data.
	BucketName = "resource_control"
)

// Service represents a service for managing environment(endpoint) data.
type Service struct {
	connection *internal.DbConnection
}

// NewService creates a new instance of a service.
func NewService(connection *internal.DbConnection) (*Service, error) {
	err := connection.CreateBucket(BucketName)
	if err != nil {
		return nil, err
	}

	return &Service{
		connection: connection,
	}, nil
}

// ResourceControl returns a ResourceControl object by ID
func (service *Service) ResourceControl(ID portainer.ResourceControlID) (*portainer.ResourceControl, error) {
	var resourceControl portainer.ResourceControl
	identifier := internal.Itob(int(ID))

	err := service.connection.GetObject(BucketName, identifier, &resourceControl)
	if err != nil {
		return nil, err
	}

	return &resourceControl, nil
}

// ResourceControlByResourceIDAndType returns a ResourceControl object by checking if the resourceID is equal
// to the main ResourceID or in SubResourceIDs. It also performs a check on the resource type. Return nil
// if no ResourceControl was found.
func (service *Service) ResourceControlByResourceIDAndType(resourceID string, resourceType portainer.ResourceControlType) (*portainer.ResourceControl, error) {
	var resourceControl *portainer.ResourceControl
	stop := fmt.Errorf("ok")
	err := service.connection.GetAll(
		BucketName,
		&portainer.ResourceControl{},
		func(obj interface{}) (interface{}, error) {
			rc, ok := obj.(*portainer.ResourceControl)
			if !ok {
				logrus.WithField("obj", obj).Errorf("Failed to convert to ResourceControl object")
				return nil, fmt.Errorf("Failed to convert to ResourceControl object: %s", obj)
			}

			if rc.ResourceID == resourceID && rc.Type == resourceType {
				resourceControl = rc
				return nil, stop
			}

			for _, subResourceID := range rc.SubResourceIDs {
				if subResourceID == resourceID {
					resourceControl = rc
					return nil, stop
				}
			}
			return &portainer.ResourceControl{}, nil
		})
	if err == stop {
		return resourceControl, nil
	}
	if err == nil {
		return nil, errors.ErrObjectNotFound
	}

	return nil, err
}

// ResourceControls returns all the ResourceControl objects
func (service *Service) ResourceControls() ([]portainer.ResourceControl, error) {
	var rcs = make([]portainer.ResourceControl, 0)

	err := service.connection.GetAll(
		BucketName,
		&portainer.ResourceControl{},
		func(obj interface{}) (interface{}, error) {
			rc, ok := obj.(*portainer.ResourceControl)
			if !ok {
				logrus.WithField("obj", obj).Errorf("Failed to convert to ResourceControl object")
				return nil, fmt.Errorf("Failed to convert to ResourceControl object: %s", obj)
			}
			rcs = append(rcs, *rc)
			return &portainer.ResourceControl{}, nil
		})

	return rcs, err
}

// CreateResourceControl creates a new ResourceControl object
func (service *Service) Create(resourceControl *portainer.ResourceControl) error {
	return service.connection.CreateObject(
		BucketName,
		func(id uint64) (int, interface{}) {
			resourceControl.ID = portainer.ResourceControlID(id)
			return int(resourceControl.ID), resourceControl
		},
	)
}

// UpdateResourceControl saves a ResourceControl object.
func (service *Service) UpdateResourceControl(ID portainer.ResourceControlID, resourceControl *portainer.ResourceControl) error {
	identifier := internal.Itob(int(ID))
	return service.connection.UpdateObject(BucketName, identifier, resourceControl)
}

// DeleteResourceControl deletes a ResourceControl object by ID
func (service *Service) DeleteResourceControl(ID portainer.ResourceControlID) error {
	identifier := internal.Itob(int(ID))
	return service.connection.DeleteObject(BucketName, identifier)
}
