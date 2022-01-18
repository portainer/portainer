package stack

import (
	"fmt"
	"strings"

	"github.com/sirupsen/logrus"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices/errors"
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
	err := connection.SetServiceName(BucketName)
	if err != nil {
		return nil, err
	}

	return &Service{
		connection: connection,
	}, nil
}

// Stack returns a stack object by ID.
func (service *Service) Stack(ID portainer.StackID) (*portainer.Stack, error) {
	var stack portainer.Stack
	identifier := service.connection.ConvertToKey(int(ID))

	err := service.connection.GetObject(BucketName, identifier, &stack)
	if err != nil {
		return nil, err
	}

	return &stack, nil
}

// StackByName returns a stack object by name.
func (service *Service) StackByName(name string) (*portainer.Stack, error) {
	var s *portainer.Stack

	stop := fmt.Errorf("ok")
	err := service.connection.GetAll(
		BucketName,
		&portainer.Stack{},
		func(obj interface{}) (interface{}, error) {
			stack, ok := obj.(*portainer.Stack)
			if !ok {
				logrus.WithField("obj", obj).Errorf("Failed to convert to Stack object")
				return nil, fmt.Errorf("Failed to convert to Stack object: %s", obj)
			}
			if stack.Name == name {
				s = stack
				return nil, stop
			}
			return &portainer.Stack{}, nil
		})
	if err == stop {
		return s, nil
	}
	if err == nil {
		return nil, errors.ErrObjectNotFound
	}

	return nil, err
}

// Stacks returns an array containing all the stacks with same name
func (service *Service) StacksByName(name string) ([]portainer.Stack, error) {
	var stacks = make([]portainer.Stack, 0)

	err := service.connection.GetAll(
		BucketName,
		&portainer.Stack{},
		func(obj interface{}) (interface{}, error) {
			stack, ok := obj.(portainer.Stack)
			if !ok {
				logrus.WithField("obj", obj).Errorf("Failed to convert to Stack object")
				return nil, fmt.Errorf("Failed to convert to Stack object: %s", obj)
			}
			if stack.Name == name {
				stacks = append(stacks, stack)
			}
			return &portainer.Stack{}, nil
		})

	return stacks, err
}

// Stacks returns an array containing all the stacks.
func (service *Service) Stacks() ([]portainer.Stack, error) {
	var stacks = make([]portainer.Stack, 0)

	err := service.connection.GetAll(
		BucketName,
		&portainer.Stack{},
		func(obj interface{}) (interface{}, error) {
			stack, ok := obj.(*portainer.Stack)
			if !ok {
				logrus.WithField("obj", obj).Errorf("Failed to convert to Stack object")
				return nil, fmt.Errorf("Failed to convert to Stack object: %s", obj)
			}
			stacks = append(stacks, *stack)
			return &portainer.Stack{}, nil
		})

	return stacks, err
}

// GetNextIdentifier returns the next identifier for a stack.
func (service *Service) GetNextIdentifier() int {
	return service.connection.GetNextIdentifier(BucketName)
}

// CreateStack creates a new stack.
func (service *Service) Create(stack *portainer.Stack) error {
	return service.connection.CreateObjectWithSetSequence(BucketName, int(stack.ID), stack)
}

// UpdateStack updates a stack.
func (service *Service) UpdateStack(ID portainer.StackID, stack *portainer.Stack) error {
	identifier := service.connection.ConvertToKey(int(ID))
	return service.connection.UpdateObject(BucketName, identifier, stack)
}

// DeleteStack deletes a stack.
func (service *Service) DeleteStack(ID portainer.StackID) error {
	identifier := service.connection.ConvertToKey(int(ID))
	return service.connection.DeleteObject(BucketName, identifier)
}

// StackByWebhookID returns a pointer to a stack object by webhook ID.
// It returns nil, errors.ErrObjectNotFound if there's no stack associated with the webhook ID.
func (service *Service) StackByWebhookID(id string) (*portainer.Stack, error) {
	var s *portainer.Stack
	stop := fmt.Errorf("ok")
	err := service.connection.GetAll(
		BucketName,
		&portainer.Stack{},
		func(obj interface{}) (interface{}, error) {
			var ok bool
			s, ok = obj.(*portainer.Stack)

			if !ok {
				logrus.WithField("obj", obj).Errorf("Failed to convert to Stack object")
				return &portainer.Stack{}, nil
			}

			if s.AutoUpdate != nil && strings.EqualFold(s.AutoUpdate.Webhook, id) {
				return nil, stop
			}
			return &portainer.Stack{}, nil
		})
	if err == stop {
		return s, nil
	}
	if err == nil {
		return nil, errors.ErrObjectNotFound
	}

	return nil, err

}

// RefreshableStacks returns stacks that are configured for a periodic update
func (service *Service) RefreshableStacks() ([]portainer.Stack, error) {
	stacks := make([]portainer.Stack, 0)

	err := service.connection.GetAll(
		BucketName,
		&portainer.Stack{},
		func(obj interface{}) (interface{}, error) {
			stack, ok := obj.(*portainer.Stack)
			if !ok {
				logrus.WithField("obj", obj).Errorf("Failed to convert to Stack object")
				return nil, fmt.Errorf("Failed to convert to Stack object: %s", obj)
			}
			if stack.AutoUpdate != nil && stack.AutoUpdate.Interval != "" {
				stacks = append(stacks, *stack)
			}
			return &portainer.Stack{}, nil
		})

	return stacks, err
}
