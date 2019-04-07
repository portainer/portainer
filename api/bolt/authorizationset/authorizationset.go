package authorizationset

import (
	"github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/bolt/internal"

	"github.com/boltdb/bolt"
)

const (
	// BucketName represents the name of the bucket where this service stores data.
	BucketName = "sets"
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

// AuthorizationSet returns a AuthorizationSet by ID
func (service *Service) AuthorizationSet(ID portainer.AuthorizationSetID) (*portainer.AuthorizationSet, error) {
	var set portainer.AuthorizationSet
	identifier := internal.Itob(int(ID))

	err := internal.GetObject(service.db, BucketName, identifier, &set)
	if err != nil {
		return nil, err
	}

	return &set, nil
}

// AuthorizationSets return an array containing all the sets.
func (service *Service) AuthorizationSets() ([]portainer.AuthorizationSet, error) {
	var sets = make([]portainer.AuthorizationSet, 0)

	err := service.db.View(func(tx *bolt.Tx) error {
		bucket := tx.Bucket([]byte(BucketName))

		cursor := bucket.Cursor()
		for k, v := cursor.First(); k != nil; k, v = cursor.Next() {
			var set portainer.AuthorizationSet
			err := internal.UnmarshalObject(v, &set)
			if err != nil {
				return err
			}
			sets = append(sets, set)
		}

		return nil
	})

	return sets, err
}

// UpdateAuthorizationSet saves a AuthorizationSet.
func (service *Service) UpdateAuthorizationSet(ID portainer.AuthorizationSetID, set *portainer.AuthorizationSet) error {
	identifier := internal.Itob(int(ID))
	return internal.UpdateObject(service.db, BucketName, identifier, set)
}

// CreateAuthorizationSet creates a new AuthorizationSet.
func (service *Service) CreateAuthorizationSet(set *portainer.AuthorizationSet) error {
	return service.db.Update(func(tx *bolt.Tx) error {
		bucket := tx.Bucket([]byte(BucketName))

		id, _ := bucket.NextSequence()
		set.ID = portainer.AuthorizationSetID(id)

		data, err := internal.MarshalObject(set)
		if err != nil {
			return err
		}

		return bucket.Put(internal.Itob(int(set.ID)), data)
	})
}

// DeleteAuthorizationSet deletes a AuthorizationSet.
func (service *Service) DeleteAuthorizationSet(ID portainer.AuthorizationSetID) error {
	identifier := internal.Itob(int(ID))
	return internal.DeleteObject(service.db, BucketName, identifier)
}
