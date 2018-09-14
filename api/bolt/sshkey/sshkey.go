package sshkey

import (
	"github.com/portainer/portainer"
	"github.com/portainer/portainer/bolt/internal"
	"github.com/boltdb/bolt"
)

const (
	// BucketName represents the name of the bucket where this service stores data.
	BucketName = "sshkeys"
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

// Keys return an array containing all the keys.
func (service *Service) Sshkeys() ([]portainer.Sshkey, error) {
	var sshkeys = make([]portainer.Sshkey, 0)

	err := service.db.View(func(tx *bolt.Tx) error {
		bucket := tx.Bucket([]byte(BucketName))

		cursor := bucket.Cursor()
		for k, v := cursor.First(); k != nil; k, v = cursor.Next() {
			var sshkey portainer.Sshkey
			err := internal.UnmarshalObject(v, &sshkey)
			if err != nil {
				return err
			}
			sshkeys = append(sshkeys, sshkey)
		}

		return nil
	})

	return sshkeys, err
}

// CreateKey creates a new key.
func (service *Service) CreateSshkey(sshkey *portainer.Sshkey) error {
	return service.db.Update(func(tx *bolt.Tx) error {
		bucket := tx.Bucket([]byte(BucketName))

		id, _ := bucket.NextSequence()
		sshkey.ID = portainer.SshkeyID(id)

		data, err := internal.MarshalObject(sshkey)
		if err != nil {
			return err
		}

		return bucket.Put(internal.Itob(int(sshkey.ID)), data)
	})
}

// DeleteSshkey deletes a key.
func (service *Service) DeleteSshkey(ID portainer.SshkeyID) error {
	identifier := internal.Itob(int(ID))
	return internal.DeleteObject(service.db, BucketName, identifier)
}
