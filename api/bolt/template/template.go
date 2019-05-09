package template

import (
	"github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/bolt/internal"

	"github.com/boltdb/bolt"
)

const (
	// BucketName represents the name of the bucket where this service stores data.
	BucketName = "templates"
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

// Templates return an array containing all the templates.
func (service *Service) Templates() ([]portainer.Template, error) {
	var templates = make([]portainer.Template, 0)

	err := service.db.View(func(tx *bolt.Tx) error {
		bucket := tx.Bucket([]byte(BucketName))

		cursor := bucket.Cursor()
		for k, v := cursor.First(); k != nil; k, v = cursor.Next() {
			var template portainer.Template
			err := internal.UnmarshalObject(v, &template)
			if err != nil {
				return err
			}
			templates = append(templates, template)
		}

		return nil
	})

	return templates, err
}

// Template returns a template by ID.
func (service *Service) Template(ID portainer.TemplateID) (*portainer.Template, error) {
	var template portainer.Template
	identifier := internal.Itob(int(ID))

	err := internal.GetObject(service.db, BucketName, identifier, &template)
	if err != nil {
		return nil, err
	}

	return &template, nil
}

// CreateTemplate creates a new template.
func (service *Service) CreateTemplate(template *portainer.Template) error {
	return service.db.Update(func(tx *bolt.Tx) error {
		bucket := tx.Bucket([]byte(BucketName))

		id, _ := bucket.NextSequence()
		template.ID = portainer.TemplateID(id)

		data, err := internal.MarshalObject(template)
		if err != nil {
			return err
		}

		return bucket.Put(internal.Itob(int(template.ID)), data)
	})
}

// UpdateTemplate saves a template.
func (service *Service) UpdateTemplate(ID portainer.TemplateID, template *portainer.Template) error {
	identifier := internal.Itob(int(ID))
	return internal.UpdateObject(service.db, BucketName, identifier, template)
}

// DeleteTemplate deletes a template.
func (service *Service) DeleteTemplate(ID portainer.TemplateID) error {
	identifier := internal.Itob(int(ID))
	return internal.DeleteObject(service.db, BucketName, identifier)
}
