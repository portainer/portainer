package extension

import (
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/bolt/internal"

	"github.com/boltdb/bolt"
)

const (
	// BucketName represents the name of the bucket where this service stores data.
	BucketName = "extension"
)

// Service represents a service for managing environment(endpoint) data.
type Service struct {
	connection *internal.DbConnection
}

// NewService creates a new instance of a service.
func NewService(connection *internal.DbConnection) (*Service, error) {
	err := internal.CreateBucket(connection, BucketName)
	if err != nil {
		return nil, err
	}

	return &Service{
		connection: connection,
	}, nil
}

// Extension returns a extension by ID
func (service *Service) Extension(ID portainer.ExtensionID) (*portainer.Extension, error) {
	var extension portainer.Extension
	identifier := internal.Itob(int(ID))

	err := internal.GetObject(service.connection, BucketName, identifier, &extension)
	if err != nil {
		return nil, err
	}

	return &extension, nil
}

// Extensions return an array containing all the extensions.
func (service *Service) Extensions() ([]portainer.Extension, error) {
	var extensions = make([]portainer.Extension, 0)

	err := service.connection.View(func(tx *bolt.Tx) error {
		bucket := tx.Bucket([]byte(BucketName))

		cursor := bucket.Cursor()
		for k, v := cursor.First(); k != nil; k, v = cursor.Next() {
			var extension portainer.Extension
			err := internal.UnmarshalObject(v, &extension)
			if err != nil {
				return err
			}
			extensions = append(extensions, extension)
		}

		return nil
	})

	return extensions, err
}

// Persist persists a extension inside the database.
func (service *Service) Persist(extension *portainer.Extension) error {
	return service.connection.Update(func(tx *bolt.Tx) error {
		bucket := tx.Bucket([]byte(BucketName))

		data, err := internal.MarshalObject(extension)
		if err != nil {
			return err
		}

		return bucket.Put(internal.Itob(int(extension.ID)), data)
	})
}

// DeleteExtension deletes a Extension.
func (service *Service) DeleteExtension(ID portainer.ExtensionID) error {
	identifier := internal.Itob(int(ID))
	return internal.DeleteObject(service.connection, BucketName, identifier)
}
