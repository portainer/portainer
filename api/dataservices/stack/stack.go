package stack

import (
	portainer "github.com/portainer/portainer/api"
)

// Service represents a service for managing environment(endpoint) data.
type Service struct {
	connection portainer.Connection
}

// NewService creates a new instance of a service.
func NewService(connection portainer.Connection) (*Service, error) {
	return &Service{
		connection: connection,
	}, nil
}

// Stack returns a stack object by ID.
func (service *Service) Stack(ID portainer.StackID) (*portainer.Stack, error) {
	var obj portainer.Stack

	err := service.connection.GetByID(int(ID), &obj)
	if err != nil {
		return nil, err
	}

	return &obj, nil
}

// StackByName returns a stack object by name.
func (service *Service) StackByName(name string) (*portainer.Stack, error) {
	var s portainer.Stack

	db := service.connection.GetDB()
	tx := db.First(&s, `name = ?`, name)

	if tx.Error != nil {
		return nil, tx.Error
	}

	return &s, nil
}

// Stacks returns an array containing all the stacks with same name
func (service *Service) StacksByName(name string) ([]portainer.Stack, error) {
	var stacks = make([]portainer.Stack, 0)

	db := service.connection.GetDB()
	tx := db.Find(&stacks, `name = ?`, name)
	if tx.Error != nil {
		return nil, tx.Error
	}

	return stacks, nil
}

// Stacks returns an array containing all the stacks.
func (service *Service) Stacks() ([]portainer.Stack, error) {
	var stacks = make([]portainer.Stack, 0)

	db := service.connection.GetDB()
	tx := db.Find(&stacks)
	if tx.Error != nil {
		return nil, tx.Error
	}

	return stacks, nil
}

// CreateStack creates a new stack.
func (service *Service) Create(stack *portainer.Stack) error {
	db := service.connection.GetDB()
	tx := db.Create(&stack)
	if tx.Error != nil {
		return tx.Error
	}
	return nil
}

// UpdateStack updates a stack.
func (service *Service) UpdateStack(ID portainer.StackID, stack *portainer.Stack) error {
	db := service.connection.GetDB()
	stack.ID = ID
	tx := db.Save(&stack)
	if tx.Error != nil {
		return tx.Error
	}
	return nil
}

// DeleteStack deletes a stack.
func (service *Service) DeleteStack(ID portainer.StackID) error {
	return service.connection.DeleteByID(int(ID), &portainer.Stack{})
}

// StackByWebhookID returns a pointer to a stack object by webhook ID.
// It returns nil, errors.ErrObjectNotFound if there's no stack associated with the webhook ID.
func (service *Service) StackByWebhookID(id string) (*portainer.Stack, error) {
	db := service.connection.GetDB()

	var stacks = make([]portainer.Stack, 0)
	tx := db.Find(&stacks)
	if tx.Error != nil {
		return nil, tx.Error
	}

	for _, stack := range stacks {
		if stack.AutoUpdate != nil && stack.AutoUpdate.Webhook != "" && stack.AutoUpdate.Webhook == id {
			return &stack, nil
		}
	}

	return nil, nil
}

// RefreshableStacks returns stacks that are configured for a periodic update
func (service *Service) RefreshableStacks() ([]portainer.Stack, error) {

	db := service.connection.GetDB()

	var stacks = make([]portainer.Stack, 0)
	var stacksRes = make([]portainer.Stack, 0)
	tx := db.Find(&stacks)
	if tx.Error != nil {
		return nil, tx.Error
	}

	for _, stack := range stacks {
		if stack.AutoUpdate != nil && stack.AutoUpdate.Interval != "" {
			stacksRes = append(stacksRes, stack)
		}
	}

	return stacksRes, nil
}
