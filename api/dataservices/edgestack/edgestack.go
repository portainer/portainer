package edgestack

import (
	"fmt"
	"sync"

	portainer "github.com/portainer/portainer/api"
	"github.com/sirupsen/logrus"
)

const (
	// BucketName represents the name of the bucket where this service stores data.
	BucketName = "edge_stack"
)

// Service represents a service for managing Edge stack data.
type Service struct {
	connection portainer.Connection
	cache      map[portainer.EdgeStackID]*portainer.EdgeStack
	mu         sync.RWMutex
}

func cloneEdgeStack(src *portainer.EdgeStack) *portainer.EdgeStack {
	if src == nil {
		return nil
	}

	c := *src

	if src.EdgeGroups != nil {
		c.EdgeGroups = make([]portainer.EdgeGroupID, len(src.EdgeGroups))
		copy(c.EdgeGroups, src.EdgeGroups)
	}

	if src.Status != nil {
		c.Status = make(map[portainer.EndpointID]portainer.EdgeStackStatus)
		for k, v := range src.Status {
			c.Status[k] = v
		}
	}

	return &c
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
		cache:      make(map[portainer.EdgeStackID]*portainer.EdgeStack),
	}, nil
}

// EdgeStacks returns an array containing all edge stacks
func (service *Service) EdgeStacks() ([]portainer.EdgeStack, error) {
	var stacks = make([]portainer.EdgeStack, 0)

	err := service.connection.GetAll(
		BucketName,
		&portainer.EdgeStack{},
		func(obj interface{}) (interface{}, error) {
			//var tag portainer.Tag
			stack, ok := obj.(*portainer.EdgeStack)
			if !ok {
				logrus.WithField("obj", obj).Errorf("Failed to convert to EdgeStack object")
				return nil, fmt.Errorf("Failed to convert to EdgeStack object: %s", obj)
			}
			stacks = append(stacks, *stack)
			return &portainer.EdgeStack{}, nil
		})

	return stacks, err
}

// EdgeStack returns an Edge stack by ID.
func (service *Service) EdgeStack(ID portainer.EdgeStackID) (*portainer.EdgeStack, error) {
	service.mu.RLock()
	if c, ok := service.cache[ID]; ok {
		e := cloneEdgeStack(c)
		service.mu.RUnlock()

		return e, nil
	}
	service.mu.RUnlock()

	service.mu.Lock()
	defer service.mu.Unlock()

	var stack portainer.EdgeStack
	identifier := service.connection.ConvertToKey(int(ID))

	err := service.connection.GetObject(BucketName, identifier, &stack)
	if err != nil {
		return nil, err
	}

	service.cache[ID] = cloneEdgeStack(&stack)

	return &stack, nil
}

// CreateEdgeStack saves an Edge stack object to db.
func (service *Service) Create(id portainer.EdgeStackID, edgeStack *portainer.EdgeStack) error {

	edgeStack.ID = id

	return service.connection.CreateObjectWithId(
		BucketName,
		int(edgeStack.ID),
		edgeStack,
	)
}

// UpdateEdgeStack updates an Edge stack.
func (service *Service) UpdateEdgeStack(ID portainer.EdgeStackID, edgeStack *portainer.EdgeStack) error {
	defer service.invalidateCacheForID(ID)

	identifier := service.connection.ConvertToKey(int(ID))
	return service.connection.UpdateObject(BucketName, identifier, edgeStack)
}

// DeleteEdgeStack deletes an Edge stack.
func (service *Service) DeleteEdgeStack(ID portainer.EdgeStackID) error {
	defer service.invalidateCacheForID(ID)

	identifier := service.connection.ConvertToKey(int(ID))
	return service.connection.DeleteObject(BucketName, identifier)
}

// GetNextIdentifier returns the next identifier for an environment(endpoint).
func (service *Service) GetNextIdentifier() int {
	return service.connection.GetNextIdentifier(BucketName)
}

func (service *Service) invalidateCacheForID(ID portainer.EdgeStackID) {
	service.mu.Lock()
	delete(service.cache, ID)
	service.mu.Unlock()
}

func (service *Service) InvalidateCache() {
	service.mu.Lock()
	service.cache = make(map[portainer.EdgeStackID]*portainer.EdgeStack)
	service.mu.Unlock()
}
