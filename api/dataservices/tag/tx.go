package tag

import (
	"errors"
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

// Tags return an array containing all the tags.
func (service ServiceTx) Tags() ([]portainer.Tag, error) {
	var tags = make([]portainer.Tag, 0)

	err := service.tx.GetAll(
		BucketName,
		&portainer.Tag{},
		func(obj interface{}) (interface{}, error) {
			tag, ok := obj.(*portainer.Tag)
			if !ok {
				log.Debug().Str("obj", fmt.Sprintf("%#v", obj)).Msg("failed to convert to Tag object")
				return nil, fmt.Errorf("failed to convert to Tag object: %s", obj)
			}

			tags = append(tags, *tag)

			return &portainer.Tag{}, nil
		})

	return tags, err
}

// Tag returns a tag by ID.
func (service ServiceTx) Tag(ID portainer.TagID) (*portainer.Tag, error) {
	var tag portainer.Tag
	identifier := service.service.connection.ConvertToKey(int(ID))

	err := service.tx.GetObject(BucketName, identifier, &tag)
	if err != nil {
		return nil, err
	}

	return &tag, nil
}

// CreateTag creates a new tag.
func (service ServiceTx) Create(tag *portainer.Tag) error {
	return service.tx.CreateObject(
		BucketName,
		func(id uint64) (int, interface{}) {
			tag.ID = portainer.TagID(id)
			return int(tag.ID), tag
		},
	)
}

// UpdateTag updates a tag
func (service ServiceTx) UpdateTag(ID portainer.TagID, tag *portainer.Tag) error {
	identifier := service.service.connection.ConvertToKey(int(ID))
	return service.tx.UpdateObject(BucketName, identifier, tag)
}

// UpdateTagFunc is a no-op inside a transaction
func (service ServiceTx) UpdateTagFunc(ID portainer.TagID, updateFunc func(tag *portainer.Tag)) error {
	return errors.New("cannot be called inside a transaction")
}

// DeleteTag deletes a tag.
func (service ServiceTx) DeleteTag(ID portainer.TagID) error {
	identifier := service.service.connection.ConvertToKey(int(ID))
	return service.tx.DeleteObject(BucketName, identifier)
}
