package resourcecontrol

import (
	"fmt"

	portainer "github.com/portainer/portainer/api"

	"github.com/rs/zerolog/log"
)

type ServiceTx struct {
	service *Service
	tx      portainer.Transaction
}

func (service ServiceTx) BucketName() string {
	return BucketName
}

// ResourceControl returns a ResourceControl object by ID
func (service ServiceTx) ResourceControl(ID portainer.ResourceControlID) (*portainer.ResourceControl, error) {
	var resourceControl portainer.ResourceControl
	identifier := service.service.connection.ConvertToKey(int(ID))

	err := service.tx.GetObject(BucketName, identifier, &resourceControl)
	if err != nil {
		return nil, err
	}

	return &resourceControl, nil
}

// ResourceControlByResourceIDAndType returns a ResourceControl object by checking if the resourceID is equal
// to the main ResourceID or in SubResourceIDs. It also performs a check on the resource type. Return nil
// if no ResourceControl was found.
func (service ServiceTx) ResourceControlByResourceIDAndType(resourceID string, resourceType portainer.ResourceControlType) (*portainer.ResourceControl, error) {
	var resourceControl *portainer.ResourceControl
	stop := fmt.Errorf("ok")
	err := service.tx.GetAll(
		BucketName,
		&portainer.ResourceControl{},
		func(obj interface{}) (interface{}, error) {
			rc, ok := obj.(*portainer.ResourceControl)
			if !ok {
				log.Debug().Str("obj", fmt.Sprintf("%#v", obj)).Msg("failed to convert to ResourceControl object")
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

	return nil, err
}

// ResourceControls returns all the ResourceControl objects
func (service ServiceTx) ResourceControls() ([]portainer.ResourceControl, error) {
	var rcs = make([]portainer.ResourceControl, 0)

	err := service.tx.GetAll(
		BucketName,
		&portainer.ResourceControl{},
		func(obj interface{}) (interface{}, error) {
			rc, ok := obj.(*portainer.ResourceControl)
			if !ok {
				log.Debug().Str("obj", fmt.Sprintf("%#v", obj)).Msg("failed to convert to ResourceControl object")
				return nil, fmt.Errorf("Failed to convert to ResourceControl object: %s", obj)
			}

			rcs = append(rcs, *rc)

			return &portainer.ResourceControl{}, nil
		})

	return rcs, err
}

// CreateResourceControl creates a new ResourceControl object
func (service ServiceTx) Create(resourceControl *portainer.ResourceControl) error {
	return service.tx.CreateObject(
		BucketName,
		func(id uint64) (int, interface{}) {
			resourceControl.ID = portainer.ResourceControlID(id)
			return int(resourceControl.ID), resourceControl
		},
	)
}

// UpdateResourceControl saves a ResourceControl object.
func (service ServiceTx) UpdateResourceControl(ID portainer.ResourceControlID, resourceControl *portainer.ResourceControl) error {
	identifier := service.service.connection.ConvertToKey(int(ID))
	return service.tx.UpdateObject(BucketName, identifier, resourceControl)
}

// DeleteResourceControl deletes a ResourceControl object by ID
func (service ServiceTx) DeleteResourceControl(ID portainer.ResourceControlID) error {
	identifier := service.service.connection.ConvertToKey(int(ID))
	return service.tx.DeleteObject(BucketName, identifier)
}
