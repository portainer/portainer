package stack

import (
	"errors"
	"strings"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	dserrors "github.com/portainer/portainer/api/dataservices/errors"
)

// BucketName represents the name of the bucket where this service stores data.
const BucketName = "stacks"

// Service represents a service for managing environment(endpoint) data.
type Service struct {
	dataservices.BaseDataService[portainer.Stack, portainer.StackID]
}

// NewService creates a new instance of a service.
func NewService(connection portainer.Connection) (*Service, error) {
	err := connection.SetServiceName(BucketName)
	if err != nil {
		return nil, err
	}

	return &Service{
		BaseDataService: dataservices.BaseDataService[portainer.Stack, portainer.StackID]{
			Bucket:     BucketName,
			Connection: connection,
		},
	}, nil
}

func (service *Service) Tx(tx portainer.Transaction) ServiceTx {
	return ServiceTx{
		BaseDataServiceTx: service.BaseDataService.Tx(tx),
	}
}

// StackByName returns a stack object by name.
func (service *Service) StackByName(name string) (*portainer.Stack, error) {
	var s portainer.Stack

	err := service.Connection.GetAll(
		BucketName,
		&portainer.Stack{},
		dataservices.FirstFn(&s, func(e portainer.Stack) bool {
			return e.Name == name
		}),
	)

	if errors.Is(err, dataservices.ErrStop) {
		return &s, nil
	}

	if err == nil {
		return nil, dserrors.ErrObjectNotFound
	}

	return nil, err
}

// Stacks returns an array containing all the stacks with same name
func (service *Service) StacksByName(name string) ([]portainer.Stack, error) {
	var stacks = make([]portainer.Stack, 0)

	return stacks, service.Connection.GetAll(
		BucketName,
		&portainer.Stack{},
		dataservices.FilterFn(&stacks, func(e portainer.Stack) bool {
			return e.Name == name
		}),
	)
}

// GetNextIdentifier returns the next identifier for a stack.
func (service *Service) GetNextIdentifier() int {
	return service.Connection.GetNextIdentifier(BucketName)
}

// CreateStack creates a new stack.
func (service *Service) Create(stack *portainer.Stack) error {
	return service.Connection.CreateObjectWithId(BucketName, int(stack.ID), stack)
}

// StackByWebhookID returns a pointer to a stack object by webhook ID.
// It returns nil, errors.ErrObjectNotFound if there's no stack associated with the webhook ID.
func (service *Service) StackByWebhookID(id string) (*portainer.Stack, error) {
	var s portainer.Stack

	err := service.Connection.GetAll(
		BucketName,
		&portainer.Stack{},
		dataservices.FirstFn(&s, func(e portainer.Stack) bool {
			return e.AutoUpdate != nil && strings.EqualFold(e.AutoUpdate.Webhook, id)
		}),
	)

	if errors.Is(err, dataservices.ErrStop) {
		return &s, nil
	}

	if err == nil {
		return nil, dserrors.ErrObjectNotFound
	}

	return nil, err

}

// RefreshableStacks returns stacks that are configured for a periodic update
func (service *Service) RefreshableStacks() ([]portainer.Stack, error) {
	stacks := make([]portainer.Stack, 0)

	return stacks, service.Connection.GetAll(
		BucketName,
		&portainer.Stack{},
		dataservices.FilterFn(&stacks, func(e portainer.Stack) bool {
			return e.AutoUpdate != nil && e.AutoUpdate.Interval != ""
		}),
	)
}
