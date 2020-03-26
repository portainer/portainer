package tagassociation

import (
	"github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/bolt/internal"

	"github.com/boltdb/bolt"
)

const (
	// BucketName represents the name of the bucket where this service stores data.
	BucketName = "tagassociations"
)

// Service represents a service for managing endpoint data.
type Service struct {
	db *bolt.DB
}

// NewService creates a new instance of a service.
func NewService(db *bolt.DB) (*Service, error) {
	err := internal.CreateBucket(db, BucketName)
	if err != nil {
		return nil, err
	}

	return &Service{
		db: db,
	}, nil
}

// TagAssociations return an array containing all the Tag Associations.
func (service *Service) TagAssociations() ([]portainer.TagAssociation, error) {
	var tagAssociations = make([]portainer.TagAssociation, 0)

	err := service.db.View(func(tx *bolt.Tx) error {
		bucket := tx.Bucket([]byte(BucketName))

		cursor := bucket.Cursor()
		for k, v := cursor.First(); k != nil; k, v = cursor.Next() {
			var tagAssociation portainer.TagAssociation
			err := internal.UnmarshalObject(v, &tagAssociation)
			if err != nil {
				return err
			}
			tagAssociations = append(tagAssociations, tagAssociation)
		}

		return nil
	})

	return tagAssociations, err
}

// TagAssociationByTagID returns a tag association by tag ID.
func (service *Service) TagAssociationByTagID(tagID portainer.TagID) (*portainer.TagAssociation, error) {
	var tagAssociation portainer.TagAssociation
	identifier := internal.Itob(int(tagID))

	err := internal.GetObject(service.db, BucketName, identifier, &tagAssociation)
	if err != nil {
		return nil, err
	}

	return &tagAssociation, nil
}

// CreateTagAssociation creates a new tag association.
func (service *Service) CreateTagAssociation(tagAssociation *portainer.TagAssociation) error {
	return service.db.Update(func(tx *bolt.Tx) error {
		bucket := tx.Bucket([]byte(BucketName))

		data, err := internal.MarshalObject(tagAssociation)
		if err != nil {
			return err
		}

		return bucket.Put(internal.Itob(int(tagAssociation.TagID)), data)
	})
}

// UpdateTagAssociation updates a tag association.
func (service *Service) UpdateTagAssociation(tagID portainer.TagID, tagAssociation *portainer.TagAssociation) error {
	identifier := internal.Itob(int(tagID))
	return internal.UpdateObject(service.db, BucketName, identifier, tagAssociation)
}

// DeleteTagAssociation deletes a tag association.
func (service *Service) DeleteTagAssociation(tagID portainer.TagID) error {
	identifier := internal.Itob(int(tagID))
	return internal.DeleteObject(service.db, BucketName, identifier)
}
