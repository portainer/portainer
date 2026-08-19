package resourcecontrol

import (
	"errors"
	"slices"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
)

type ServiceTx struct {
	dataservices.BaseDataServiceTx[portainer.ResourceControl, portainer.ResourceControlID]
}

// ResourceControlByResourceIDAndType returns a ResourceControl object by checking if the resourceID is equal
// to the main ResourceID or in SubResourceIDs. It also performs a check on the resource type. Return nil
// if no ResourceControl was found.
func (service ServiceTx) ResourceControlByResourceIDAndType(resourceID string, resourceType portainer.ResourceControlType) (*portainer.ResourceControl, error) {
	var found portainer.ResourceControl

	err := service.Tx.GetAll(
		BucketName,
		&portainer.ResourceControl{},
		dataservices.FirstFn(&found, func(rc portainer.ResourceControl) bool {
			return (rc.ResourceID == resourceID && rc.Type == resourceType) ||
				slices.Contains(rc.SubResourceIDs, resourceID)
		}),
	)

	if errors.Is(err, dataservices.ErrStop) {
		return &found, nil
	}

	if err != nil {
		return nil, err
	}

	return nil, nil
}

// CreateResourceControl creates a new ResourceControl object
func (service ServiceTx) Create(resourceControl *portainer.ResourceControl) error {
	return service.Tx.CreateObject(
		BucketName,
		func(id uint64) (int, any) {
			resourceControl.ID = portainer.ResourceControlID(id)
			return int(resourceControl.ID), resourceControl
		},
	)
}
