package webhook

import (
	"github.com/portainer/portainer"
	"github.com/portainer/portainer/bolt/internal"

	"github.com/boltdb/bolt"
)

const (
	// BucketName represents the name of the bucket where this service stores data.
	BucketName = "webhooks"
)

// Service represents a service for managing webhook data.
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

// Webhook returns a webhook by ID.
func (service *Service) Webhook(ID portainer.WebhookID) (*portainer.Webhook, error) {
	var webhook portainer.Webhook
	identifier := internal.Itob(int(ID))

	err := internal.GetObject(service.db, BucketName, identifier, &webhook)
	if err != nil {
		return nil, err
	}

	return &webhook, nil
}

// Webhook returns a webhook by the Swarm ServiceID it is associated with.
func (service *Service) WebhookByServiceID(ID string) (*portainer.Webhook, error) {
	var webhook *portainer.Webhook

	err := service.db.View(func(tx *bolt.Tx) error {
		bucket := tx.Bucket([]byte(BucketName))
		cursor := bucket.Cursor()

		for k, v := cursor.First(); k != nil; k, v = cursor.Next() {
			var w portainer.Webhook
			err := internal.UnmarshalObject(v, &w)
			if err != nil {
				return err
			}

			if w.ServiceID == ID {
				webhook = &w
				break
			}
		}

		if webhook == nil {
			return portainer.ErrObjectNotFound
		}

		return nil
	})

	return webhook, err
}

// DeleteWebhook deletes a webhook.
func (service *Service) DeleteWebhook(ID portainer.WebhookID) error {
	identifier := internal.Itob(int(ID))
	return internal.DeleteObject(service.db, BucketName, identifier)
}

// CreateWebhook assign an ID to a new webhook and saves it.
func (service *Service) CreateWebhook(webhook *portainer.Webhook) error {
	return service.db.Update(func(tx *bolt.Tx) error {
		bucket := tx.Bucket([]byte(BucketName))

		id, _ := bucket.NextSequence()
		webhook.ID = portainer.WebhookID(id)

		data, err := internal.MarshalObject(webhook)
		if err != nil {
			return err
		}

		return bucket.Put(internal.Itob(int(webhook.ID)), data)
	})
}

// GetNextIdentifier returns the next identifier for a webhook.
func (service *Service) GetNextIdentifier() int {
	return internal.GetNextIdentifier(service.db, BucketName)
}
