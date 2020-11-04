package license

import (
	"github.com/portainer/liblicense"
	"github.com/portainer/portainer/api/bolt/internal"

	"github.com/boltdb/bolt"
)

const (
	// BucketName represents the name of the bucket where this service stores data.
	BucketName = "license"
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

// License returns a license by licenseKey
func (service *Service) License(licenseKey string) (*liblicense.PortainerLicense, error) {
	var license liblicense.PortainerLicense
	identifier := []byte(licenseKey)

	err := internal.GetObject(service.db, BucketName, identifier, &license)
	if err != nil {
		return nil, err
	}

	return &license, nil
}

// Licenses return an array containing all the licenses.
func (service *Service) Licenses() ([]liblicense.PortainerLicense, error) {
	var licenses = make([]liblicense.PortainerLicense, 0)

	err := service.db.View(func(tx *bolt.Tx) error {
		bucket := tx.Bucket([]byte(BucketName))

		cursor := bucket.Cursor()
		for k, v := cursor.First(); k != nil; k, v = cursor.Next() {
			var license liblicense.PortainerLicense
			err := internal.UnmarshalObject(v, &license)
			if err != nil {
				return err
			}
			licenses = append(licenses, license)
		}

		return nil
	})

	return licenses, err
}

// AddLicense persists a license inside the database.
func (service *Service) AddLicense(licenseKey string, license *liblicense.PortainerLicense) error {
	return service.db.Update(func(tx *bolt.Tx) error {
		bucket := tx.Bucket([]byte(BucketName))

		data, err := internal.MarshalObject(license)
		if err != nil {
			return err
		}

		return bucket.Put([]byte(licenseKey), data)
	})
}

// UpdateLicense updates a license.
func (service *Service) UpdateLicense(licenseKey string, license *liblicense.PortainerLicense) error {
	identifier := []byte(licenseKey)
	return internal.UpdateObject(service.db, BucketName, identifier, license)
}

// DeleteLicense deletes a License.
func (service *Service) DeleteLicense(licenseKey string) error {
	identifier := []byte(licenseKey)
	return internal.DeleteObject(service.db, BucketName, identifier)
}
