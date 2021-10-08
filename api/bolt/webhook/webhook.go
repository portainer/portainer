package webhook

import (
	"fmt"
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/bolt/errors"
	"github.com/portainer/portainer/api/bolt/internal"
	"github.com/sirupsen/logrus"
)

const (
	// BucketName represents the name of the bucket where this service stores data.
	BucketName = "webhooks"
)

// Service represents a service for managing webhook data.
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

//Webhooks returns an array of all webhooks
func (service *Service) Webhooks() ([]portainer.Webhook, error) {
	var webhooks = make([]portainer.Webhook, 0)

	err := internal.GetAll(
		service.connection,
		BucketName,
		&portainer.Webhook{},
		func(obj interface{}) (interface{}, error) {
			webhook, ok := obj.(*portainer.Webhook)
			if !ok {
				logrus.WithField("obj", obj).Errorf("Failed to convert to Webhook object")
				return nil, fmt.Errorf("Failed to convert to Webhook object: %s", obj)
			}
			webhooks = append(webhooks, *webhook)
			return &portainer.Webhook{}, nil
		})

	return webhooks, err
}

// Webhook returns a webhook by ID.
func (service *Service) Webhook(ID portainer.WebhookID) (*portainer.Webhook, error) {
	var webhook portainer.Webhook
	identifier := internal.Itob(int(ID))

	err := internal.GetObject(service.connection, BucketName, identifier, &webhook)
	if err != nil {
		return nil, err
	}

	return &webhook, nil
}

// WebhookByResourceID returns a webhook by the ResourceID it is associated with.
func (service *Service) WebhookByResourceID(ID string) (*portainer.Webhook, error) {
	var w *portainer.Webhook
	stop := fmt.Errorf("ok")
	err := internal.GetAll(
		service.connection,
		BucketName,
		&portainer.Webhook{},
		func(obj interface{}) (interface{}, error) {
			webhook, ok := obj.(*portainer.Webhook)
			if !ok {
				logrus.WithField("obj", obj).Errorf("Failed to convert to Webhook object")
				return nil, fmt.Errorf("Failed to convert to Webhook object: %s", obj)
			}
			if webhook.ResourceID == ID {
				w = webhook
				return nil, stop
			}
			return &portainer.Webhook{}, nil
		})
	if err == stop {
		return w, nil
	}
	if err == nil {
		return nil, errors.ErrObjectNotFound
	}

	return nil, err
}

// WebhookByToken returns a webhook by the random token it is associated with.
func (service *Service) WebhookByToken(token string) (*portainer.Webhook, error) {
	var w *portainer.Webhook
	stop := fmt.Errorf("ok")
	err := internal.GetAll(
		service.connection,
		BucketName,
		&portainer.Webhook{},
		func(obj interface{}) (interface{}, error) {
			webhook, ok := obj.(*portainer.Webhook)
			if !ok {
				logrus.WithField("obj", obj).Errorf("Failed to convert to Webhook object")
				return nil, fmt.Errorf("Failed to convert to Webhook object: %s", obj)
			}
			if webhook.Token == token {
				w = webhook
				return nil, stop
			}
			return &portainer.Webhook{}, nil
		})
	if err == stop {
		return w, nil
	}
	if err == nil {
		return nil, errors.ErrObjectNotFound
	}

	return nil, err
}

// DeleteWebhook deletes a webhook.
func (service *Service) DeleteWebhook(ID portainer.WebhookID) error {
	identifier := internal.Itob(int(ID))
	return internal.DeleteObject(service.connection, BucketName, identifier)
}

// CreateWebhook assign an ID to a new webhook and saves it.
func (service *Service) Create(webhook *portainer.Webhook) error {
	return internal.CreateObject(
		service.connection,
		BucketName,
		func(id uint64) (int, interface{}) {
			webhook.ID = portainer.WebhookID(id)
			return int(webhook.ID), webhook
		},
	)
}
