package customtemplate

import (
	"github.com/boltdb/bolt"
	"github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/bolt/internal"
)

const (
	// BucketName represents the name of the bucket where this service stores data.
	BucketName = "customtemplates"
)

// Service represents a service for managing custom template data.
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

// CustomTemplates return an array containing all the custom templates.
func (service *Service) CustomTemplates() ([]portainer.CustomTemplate, error) {
	var customTemplates = make([]portainer.CustomTemplate, 0)

	err := service.db.View(func(tx *bolt.Tx) error {
		bucket := tx.Bucket([]byte(BucketName))

		cursor := bucket.Cursor()
		for k, v := cursor.First(); k != nil; k, v = cursor.Next() {
			var customTemplate portainer.CustomTemplate
			err := internal.UnmarshalObjectWithJsoniter(v, &customTemplate)
			if err != nil {
				return err
			}
			customTemplates = append(customTemplates, customTemplate)
		}

		return nil
	})

	return customTemplates, err
}

// CustomTemplate returns an custom template by ID.
func (service *Service) CustomTemplate(ID portainer.CustomTemplateID) (*portainer.CustomTemplate, error) {
	var customTemplate portainer.CustomTemplate
	identifier := internal.Itob(int(ID))

	err := internal.GetObject(service.db, BucketName, identifier, &customTemplate)
	if err != nil {
		return nil, err
	}

	return &customTemplate, nil
}

// UpdateCustomTemplate updates an custom template.
func (service *Service) UpdateCustomTemplate(ID portainer.CustomTemplateID, customTemplate *portainer.CustomTemplate) error {
	identifier := internal.Itob(int(ID))
	return internal.UpdateObject(service.db, BucketName, identifier, customTemplate)
}

// DeleteCustomTemplate deletes an custom template.
func (service *Service) DeleteCustomTemplate(ID portainer.CustomTemplateID) error {
	identifier := internal.Itob(int(ID))
	return internal.DeleteObject(service.db, BucketName, identifier)
}

// CreateCustomTemplate assign an ID to a new custom template and saves it.
func (service *Service) CreateCustomTemplate(customTemplate *portainer.CustomTemplate) error {
	return service.db.Update(func(tx *bolt.Tx) error {
		bucket := tx.Bucket([]byte(BucketName))

		id, _ := bucket.NextSequence()
		customTemplate.ID = portainer.CustomTemplateID(id)

		data, err := internal.MarshalObject(customTemplate)
		if err != nil {
			return err
		}

		return bucket.Put(internal.Itob(int(customTemplate.ID)), data)
	})
}
