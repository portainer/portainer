package webhook

import (
	portainer "github.com/portainer/portainer/api"
)

const (
	// BucketName represents the name of the bucket where this service stores data.
	BucketName = "webhooks"
)

// Service represents a service for managing webhook data.
type Service struct {
	connection portainer.Connection
}

func (service *Service) BucketName() string {
	return BucketName
}

// NewService creates a new instance of a service.
func NewService(connection portainer.Connection) (*Service, error) {
	return &Service{
		connection: connection,
	}, nil
}

// Webhooks returns an array of all webhooks
func (service *Service) Webhooks() ([]portainer.Webhook, error) {
	var webhooks = make([]portainer.Webhook, 0)
	return webhooks, nil
}

// Webhook returns a webhook by ID.
func (service *Service) Webhook(ID portainer.WebhookID) (*portainer.Webhook, error) {
	var webhook portainer.Webhook
	return &webhook, nil
}

// WebhookByResourceID returns a webhook by the ResourceID it is associated with.
func (service *Service) WebhookByResourceID(ID string) (*portainer.Webhook, error) {
	return nil, nil
}

// WebhookByToken returns a webhook by the random token it is associated with.
func (service *Service) WebhookByToken(token string) (*portainer.Webhook, error) {
	return nil, nil
}

// DeleteWebhook deletes a webhook.
func (service *Service) DeleteWebhook(ID portainer.WebhookID) error {
	return nil
}

// CreateWebhook assign an ID to a new webhook and saves it.
func (service *Service) Create(webhook *portainer.Webhook) error {
	return nil
}

// UpdateWebhook update a webhook.
func (service *Service) UpdateWebhook(ID portainer.WebhookID, webhook *portainer.Webhook) error {
	return nil
}
