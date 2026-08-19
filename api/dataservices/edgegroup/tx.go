package edgegroup

import (
	"errors"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
)

type ServiceTx struct {
	dataservices.BaseDataServiceTx[portainer.EdgeGroup, portainer.EdgeGroupID]
}

// UpdateEdgeGroupFunc is a no-op inside a transaction.
func (service ServiceTx) UpdateEdgeGroupFunc(ID portainer.EdgeGroupID, updateFunc func(edgeGroup *portainer.EdgeGroup)) error {
	return errors.New("cannot be called inside a transaction")
}

func (service ServiceTx) Create(group *portainer.EdgeGroup) error {
	es := group.Endpoints
	group.Endpoints = nil // Clear deprecated field

	err := service.Tx.CreateObject(
		BucketName,
		func(id uint64) (int, any) {
			group.ID = portainer.EdgeGroupID(id)
			return int(group.ID), group
		},
	)

	group.Endpoints = es // Restore endpoints after create

	return err
}

func (service ServiceTx) Update(ID portainer.EdgeGroupID, group *portainer.EdgeGroup) error {
	es := group.Endpoints
	group.Endpoints = nil // Clear deprecated field

	err := service.BaseDataServiceTx.Update(ID, group)

	group.Endpoints = es // Restore endpoints after update

	return err
}
