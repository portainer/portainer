package stack

import (
	portainer "github.com/portainer/portainer/api"
)

const (
	// BucketName represents the name of the bucket where this service stores data.
	BucketName = "stacks"
)

// Service represents a service for managing environment(endpoint) data.
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

// Stack returns a stack object by ID.
func (service *Service) Stack(ID portainer.StackID) (*portainer.Stack, error) {
	var stack portainer.Stack
	return &stack, nil
}

// StackByName returns a stack object by name.
func (service *Service) StackByName(name string) (*portainer.Stack, error) {
	return nil, nil
}

// Stacks returns an array containing all the stacks with same name
func (service *Service) StacksByName(name string) ([]portainer.Stack, error) {
	var stacks = make([]portainer.Stack, 0)
	return stacks, nil
}

// Stacks returns an array containing all the stacks.
func (service *Service) Stacks() ([]portainer.Stack, error) {
	var stacks = make([]portainer.Stack, 0)
	return stacks, nil
}

// GetNextIdentifier returns the next identifier for a stack.
func (service *Service) GetNextIdentifier() int {
	return 0
}

// CreateStack creates a new stack.
func (service *Service) Create(stack *portainer.Stack) error {
	return nil
}

// UpdateStack updates a stack.
func (service *Service) UpdateStack(ID portainer.StackID, stack *portainer.Stack) error {
	return nil
}

// DeleteStack deletes a stack.
func (service *Service) DeleteStack(ID portainer.StackID) error {
	return nil
}

// StackByWebhookID returns a pointer to a stack object by webhook ID.
// It returns nil, errors.ErrObjectNotFound if there's no stack associated with the webhook ID.
func (service *Service) StackByWebhookID(id string) (*portainer.Stack, error) {

	return nil, nil

}

// RefreshableStacks returns stacks that are configured for a periodic update
func (service *Service) RefreshableStacks() ([]portainer.Stack, error) {
	stacks := make([]portainer.Stack, 0)
	return stacks, nil
}
