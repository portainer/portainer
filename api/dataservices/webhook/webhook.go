package webhook

import (
	"errors"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	dserrors "github.com/portainer/portainer/api/dataservices/errors"
)

// BucketName represents the name of the bucket where this service stores data.
const BucketName = "webhooks"

// Service represents a service for managing webhook data.
type Service struct {
	connection portainer.Connection
}

func (service *Service) BucketName() string {
	return BucketName
}

// NewService creates a new instance of a service.
func NewService(connection portainer.Connection) (*Service, error) {
	err := connection.SetServiceName(BucketName)
	if err != nil {
		return nil, err
	}

	return &Service{
		connection: connection,
	}, nil
}

// Webhooks returns an array of all webhooks
func (service *Service) Webhooks() ([]portainer.Webhook, error) {
	var webhooks = make([]portainer.Webhook, 0)

	return webhooks, service.connection.GetAll(
		BucketName,
		&portainer.Webhook{},
		dataservices.AppendFn(&webhooks),
	)
}

// Webhook returns a webhook by ID.
func (service *Service) Webhook(ID portainer.WebhookID) (*portainer.Webhook, error) {
	var webhook portainer.Webhook
	identifier := service.connection.ConvertToKey(int(ID))

	err := service.connection.GetObject(BucketName, identifier, &webhook)
	if err != nil {
		return nil, err
	}

	return &webhook, nil
}

// WebhookByResourceID returns a webhook by the ResourceID it is associated with.
func (service *Service) WebhookByResourceID(ID string) (*portainer.Webhook, error) {
	var w portainer.Webhook

	err := service.connection.GetAll(
		BucketName,
		&portainer.Webhook{},
		dataservices.FirstFn(&w, func(e portainer.Webhook) bool {
			return e.ResourceID == ID
		}),
	)

	if errors.Is(err, dataservices.ErrStop) {
		return &w, nil
	}

	if err == nil {
		return nil, dserrors.ErrObjectNotFound
	}

	return nil, err
}

// WebhookByToken returns a webhook by the random token it is associated with.
func (service *Service) WebhookByToken(token string) (*portainer.Webhook, error) {
	var w portainer.Webhook

	err := service.connection.GetAll(
		BucketName,
		&portainer.Webhook{},
		dataservices.FirstFn(&w, func(e portainer.Webhook) bool {
			return e.Token == token
		}),
	)

	if errors.Is(err, dataservices.ErrStop) {
		return &w, nil
	}

	if err == nil {
		return nil, dserrors.ErrObjectNotFound
	}

	return nil, err
}

// DeleteWebhook deletes a webhook.
func (service *Service) DeleteWebhook(ID portainer.WebhookID) error {
	identifier := service.connection.ConvertToKey(int(ID))
	return service.connection.DeleteObject(BucketName, identifier)
}

// CreateWebhook assign an ID to a new webhook and saves it.
func (service *Service) Create(webhook *portainer.Webhook) error {
	return service.connection.CreateObject(
		BucketName,
		func(id uint64) (int, interface{}) {
			webhook.ID = portainer.WebhookID(id)
			return int(webhook.ID), webhook
		},
	)
}

// UpdateWebhook update a webhook.
func (service *Service) UpdateWebhook(ID portainer.WebhookID, webhook *portainer.Webhook) error {
	identifier := service.connection.ConvertToKey(int(ID))
	return service.connection.UpdateObject(BucketName, identifier, webhook)
}
