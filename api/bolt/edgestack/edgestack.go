package edgestack

import (
	"fmt"
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/bolt/internal"
	"github.com/sirupsen/logrus"
)

const (
	// BucketName represents the name of the bucket where this service stores data.
	BucketName = "edge_stack"
)

// Service represents a service for managing Edge stack data.
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

// EdgeStacks returns an array containing all edge stacks
func (service *Service) EdgeStacks() ([]portainer.EdgeStack, error) {
	var stacks = make([]portainer.EdgeStack, 0)

	err := internal.GetAll(
		service.connection,
		BucketName,
		func(obj interface{}) error {
			//var tag portainer.Tag
			stack, ok := obj.(portainer.EdgeStack)
			if !ok {
				logrus.WithField("obj", obj).Errorf("Failed to convert to EdgeStack object")
				return fmt.Errorf("Failed to convert to EdgeStack object: %s", obj)
			}
			stacks = append(stacks, stack)
			return nil
		})

	return stacks, err
}

// EdgeStack returns an Edge stack by ID.
func (service *Service) EdgeStack(ID portainer.EdgeStackID) (*portainer.EdgeStack, error) {
	var stack portainer.EdgeStack
	identifier := internal.Itob(int(ID))

	err := internal.GetObject(service.connection, BucketName, identifier, &stack)
	if err != nil {
		return nil, err
	}

	return &stack, nil
}

// CreateEdgeStack assign an ID to a new Edge stack and saves it.
func (service *Service) Create(edgeStack *portainer.EdgeStack) error {
	return internal.CreateObject(
		service.connection,
		BucketName,
		func(id uint64) (int, interface{}) {
			edgeStack.ID = portainer.EdgeStackID(id)
			return int(edgeStack.ID), edgeStack
		},
	)
}

// UpdateEdgeStack updates an Edge stack.
func (service *Service) UpdateEdgeStack(ID portainer.EdgeStackID, edgeStack *portainer.EdgeStack) error {
	identifier := internal.Itob(int(ID))
	return internal.UpdateObject(service.connection, BucketName, identifier, edgeStack)
}

// DeleteEdgeStack deletes an Edge stack.
func (service *Service) DeleteEdgeStack(ID portainer.EdgeStackID) error {
	identifier := internal.Itob(int(ID))
	return internal.DeleteObject(service.connection, BucketName, identifier)
}

// GetNextIdentifier returns the next identifier for an environment(endpoint).
func (service *Service) GetNextIdentifier() int {
	return internal.GetNextIdentifier(service.connection, BucketName)
}
