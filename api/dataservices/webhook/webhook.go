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
	dataservices.BaseDataService[portainer.Webhook, portainer.WebhookID]
}

// NewService creates a new instance of a service.
func NewService(connection portainer.Connection) (*Service, error) {
	err := connection.SetServiceName(BucketName)
	if err != nil {
		return nil, err
	}

	return &Service{
		BaseDataService: dataservices.BaseDataService[portainer.Webhook, portainer.WebhookID]{
			Bucket:     BucketName,
			Connection: connection,
		},
	}, nil
}

// WebhookByResourceID returns a webhook by the ResourceID it is associated with.
func (service *Service) WebhookByResourceID(ID string) (*portainer.Webhook, error) {
	var w portainer.Webhook

	err := service.Connection.GetAll(
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

	err := service.Connection.GetAll(
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

// CreateWebhook assign an ID to a new webhook and saves it.
func (service *Service) Create(webhook *portainer.Webhook) error {
	return service.Connection.CreateObject(
		BucketName,
		func(id uint64) (int, any) {
			webhook.ID = portainer.WebhookID(id)
			return int(webhook.ID), webhook
		},
	)
}
