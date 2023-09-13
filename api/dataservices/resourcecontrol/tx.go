package resourcecontrol

import (
	"errors"
	"fmt"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"

	"github.com/rs/zerolog/log"
)

type ServiceTx struct {
	dataservices.BaseDataServiceTx[portainer.ResourceControl, portainer.ResourceControlID]
}

// ResourceControlByResourceIDAndType returns a ResourceControl object by checking if the resourceID is equal
// to the main ResourceID or in SubResourceIDs. It also performs a check on the resource type. Return nil
// if no ResourceControl was found.
func (service ServiceTx) ResourceControlByResourceIDAndType(resourceID string, resourceType portainer.ResourceControlType) (*portainer.ResourceControl, error) {
	var resourceControl *portainer.ResourceControl
	stop := fmt.Errorf("ok")
	err := service.Tx.GetAll(
		BucketName,
		&portainer.ResourceControl{},
		func(obj interface{}) (interface{}, error) {
			rc, ok := obj.(*portainer.ResourceControl)
			if !ok {
				log.Debug().Str("obj", fmt.Sprintf("%#v", obj)).Msg("failed to convert to ResourceControl object")
				return nil, fmt.Errorf("failed to convert to ResourceControl object: %s", obj)
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
	if errors.Is(err, stop) {
		return resourceControl, nil
	}

	return nil, err
}

// CreateResourceControl creates a new ResourceControl object
func (service ServiceTx) Create(resourceControl *portainer.ResourceControl) error {
	return service.Tx.CreateObject(
		BucketName,
		func(id uint64) (int, interface{}) {
			resourceControl.ID = portainer.ResourceControlID(id)
			return int(resourceControl.ID), resourceControl
		},
	)
}
