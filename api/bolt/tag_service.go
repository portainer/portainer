package bolt

import (
	"github.com/portainer/portainer"
	"github.com/portainer/portainer/bolt/internal"

	"github.com/boltdb/bolt"
)

// TagService represents a service for managing tags.
type TagService struct {
	store *Store
}

// Tags return an array containing all the tags.
func (service *TagService) Tags() ([]portainer.Tag, error) {
	var tags = make([]portainer.Tag, 0)
	err := service.store.db.View(func(tx *bolt.Tx) error {
		bucket := tx.Bucket([]byte(tagBucketName))

		cursor := bucket.Cursor()
		for k, v := cursor.First(); k != nil; k, v = cursor.Next() {
			var tag portainer.Tag
			err := internal.UnmarshalTag(v, &tag)
			if err != nil {
				return err
			}
			tags = append(tags, tag)
		}

		return nil
	})
	if err != nil {
		return nil, err
	}

	return tags, nil
}

// CreateTag creates a new tag.
func (service *TagService) CreateTag(tag *portainer.Tag) error {
	return service.store.db.Update(func(tx *bolt.Tx) error {
		bucket := tx.Bucket([]byte(tagBucketName))

		id, _ := bucket.NextSequence()
		tag.ID = portainer.TagID(id)

		data, err := internal.MarshalTag(tag)
		if err != nil {
			return err
		}

		err = bucket.Put(internal.Itob(int(tag.ID)), data)
		if err != nil {
			return err
		}
		return nil
	})
}

// DeleteTag deletes a tag.
func (service *TagService) DeleteTag(ID portainer.TagID) error {
	return service.store.db.Update(func(tx *bolt.Tx) error {
		bucket := tx.Bucket([]byte(tagBucketName))
		err := bucket.Delete(internal.Itob(int(ID)))
		if err != nil {
			return err
		}
		return nil
	})
}
