package stack

import (
	"errors"
	"strings"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	dserrors "github.com/portainer/portainer/api/dataservices/errors"
)

type ServiceTx struct {
	dataservices.BaseDataServiceTx[portainer.Stack, portainer.StackID]
}

// StackByName returns a stack object by name.
func (service ServiceTx) StackByName(name string) (*portainer.Stack, error) {
	var s portainer.Stack

	err := service.Tx.GetAll(
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
func (service ServiceTx) StacksByName(name string) ([]portainer.Stack, error) {
	var stacks = make([]portainer.Stack, 0)

	return stacks, service.Tx.GetAll(
		BucketName,
		&portainer.Stack{},
		dataservices.FilterFn(&stacks, func(e portainer.Stack) bool {
			return e.Name == name
		}),
	)
}

// GetNextIdentifier returns the next identifier for a stack.
func (service ServiceTx) GetNextIdentifier() int {
	return service.Tx.GetNextIdentifier(BucketName)
}

// CreateStack creates a new stack.
func (service ServiceTx) Create(stack *portainer.Stack) error {
	return service.Tx.CreateObjectWithId(BucketName, int(stack.ID), stack)
}

// StackByWebhookID returns a pointer to a stack object by webhook ID.
// It returns nil, errors.ErrObjectNotFound if there's no stack associated with the webhook ID.
func (service ServiceTx) StackByWebhookID(id string) (*portainer.Stack, error) {
	var s portainer.Stack

	err := service.Tx.GetAll(
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
func (service ServiceTx) RefreshableStacks() ([]portainer.Stack, error) {
	stacks := make([]portainer.Stack, 0)

	return stacks, service.Tx.GetAll(
		BucketName,
		&portainer.Stack{},
		dataservices.FilterFn(&stacks, func(e portainer.Stack) bool {
			return e.AutoUpdate != nil && e.AutoUpdate.Interval != ""
		}),
	)
}
