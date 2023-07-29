package tag

import (
	"errors"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
)

type ServiceTx struct {
	dataservices.BaseDataServiceTx[portainer.Tag, portainer.TagID]
}

// CreateTag creates a new tag.
func (service ServiceTx) Create(tag *portainer.Tag) error {
	return service.Tx.CreateObject(
		BucketName,
		func(id uint64) (int, interface{}) {
			tag.ID = portainer.TagID(id)
			return int(tag.ID), tag
		},
	)
}

// UpdateTagFunc is a no-op inside a transaction
func (service ServiceTx) UpdateTagFunc(ID portainer.TagID, updateFunc func(tag *portainer.Tag)) error {
	return errors.New("cannot be called inside a transaction")
}
