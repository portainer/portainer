package tag

import (
	"github.com/portainer/portainer"
	"github.com/portainer/portainer/bolt/internal"

	"github.com/boltdb/bolt"
)

const (
	// BucketName represents the name of the bucket where this service stores data.
	BucketName = "tags"
)

// Service represents a service for managing endpoint data.
type Service struct {
	db *bolt.DB
}

// NewService creates a new instance of a service.
func NewService(db *bolt.DB) (*Service, error) {
	err := db.Update(func(tx *bolt.Tx) error {
		_, err := tx.CreateBucketIfNotExists([]byte(BucketName))
		if err != nil {
			return err
		}
		return nil
	})
	if err != nil {
		return nil, err
	}

	return &Service{
		db: db,
	}, nil
}

// Tags return an array containing all the tags.
func (service *Service) Tags() ([]portainer.Tag, error) {
	var tags = make([]portainer.Tag, 0)
	err := service.db.View(func(tx *bolt.Tx) error {
		bucket := tx.Bucket([]byte(BucketName))

		cursor := bucket.Cursor()
		for k, v := cursor.First(); k != nil; k, v = cursor.Next() {
			var tag portainer.Tag
			err := internal.UnmarshalObject(v, &tag)
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
func (service *Service) CreateTag(tag *portainer.Tag) error {
	return service.db.Update(func(tx *bolt.Tx) error {
		bucket := tx.Bucket([]byte(BucketName))

		id, _ := bucket.NextSequence()
		tag.ID = portainer.TagID(id)

		data, err := internal.MarshalObject(tag)
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
func (service *Service) DeleteTag(ID portainer.TagID) error {
	return service.db.Update(func(tx *bolt.Tx) error {
		bucket := tx.Bucket([]byte(BucketName))
		err := bucket.Delete(internal.Itob(int(ID)))
		if err != nil {
			return err
		}
		return nil
	})
}
