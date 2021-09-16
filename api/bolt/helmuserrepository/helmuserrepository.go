package helmuserrepository

import (
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/bolt/internal"

	"github.com/boltdb/bolt"
)

const (
	// BucketName represents the name of the bucket where this service stores data.
	BucketName = "helm_user_repository"
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

// HelmUserRepositoryByUserID return an array containing all the HelmUserRepository objects where the specified userID is present.
func (service *Service) HelmUserRepositoryByUserID(userID portainer.UserID) ([]portainer.HelmUserRepository, error) {
	var result = make([]portainer.HelmUserRepository, 0)

	err := service.connection.View(func(tx *bolt.Tx) error {
		bucket := tx.Bucket([]byte(BucketName))

		cursor := bucket.Cursor()
		for k, v := cursor.First(); k != nil; k, v = cursor.Next() {
			var record portainer.HelmUserRepository
			err := internal.UnmarshalObject(v, &record)
			if err != nil {
				return err
			}

			if record.UserID == userID {
				result = append(result, record)
			}
		}

		return nil
	})

	return result, err
}

// CreateHelmUserRepository creates a new HelmUserRepository object.
func (service *Service) CreateHelmUserRepository(record *portainer.HelmUserRepository) error {
	return service.connection.Update(func(tx *bolt.Tx) error {
		bucket := tx.Bucket([]byte(BucketName))

		id, _ := bucket.NextSequence()
		record.ID = portainer.HelmUserRepositoryID(id)

		data, err := internal.MarshalObject(record)
		if err != nil {
			return err
		}

		return bucket.Put(internal.Itob(int(record.ID)), data)
	})
}
