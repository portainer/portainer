package edgestack

import (
	"sync"

	portainer "github.com/portainer/portainer/api"
)

// BucketName represents the name of the bucket where this service stores data.
const BucketName = "edge_stack"

// Service represents a service for managing Edge stack data.
type Service struct {
	connection          portainer.Connection
	idxVersion          map[portainer.EdgeStackID]int
	mu                  sync.RWMutex
	cacheInvalidationFn func(portainer.EdgeStackID)
}

func (service *Service) BucketName() string {
	return BucketName
}

// NewService creates a new instance of a service.
func NewService(connection portainer.Connection, cacheInvalidationFn func(portainer.EdgeStackID)) (*Service, error) {
	s := &Service{
		connection:          connection,
		idxVersion:          make(map[portainer.EdgeStackID]int),
		cacheInvalidationFn: cacheInvalidationFn,
	}

	if s.cacheInvalidationFn == nil {
		s.cacheInvalidationFn = func(portainer.EdgeStackID) {}
	}

	es, err := s.EdgeStacks()
	if err != nil {
		return nil, err
	}

	for _, e := range es {
		s.idxVersion[e.ID] = e.Version
	}

	return s, nil
}

func (service *Service) Tx(tx portainer.Transaction) ServiceTx {
	return ServiceTx{
		service: service,
		tx:      tx,
	}
}

// EdgeStacks returns an array containing all edge stacks
func (service *Service) EdgeStacks() ([]portainer.EdgeStack, error) {
	var stacks = make([]portainer.EdgeStack, 0)
	return stacks, nil
}

// EdgeStack returns an Edge stack by ID.
func (service *Service) EdgeStack(ID portainer.EdgeStackID) (*portainer.EdgeStack, error) {
	var stack portainer.EdgeStack
	return &stack, nil
}

// EdgeStackVersion returns the version of the given edge stack ID directly from an in-memory index
func (service *Service) EdgeStackVersion(ID portainer.EdgeStackID) (int, bool) {
	service.mu.RLock()
	v, ok := service.idxVersion[ID]
	service.mu.RUnlock()

	return v, ok
}

// CreateEdgeStack saves an Edge stack object to db.
func (service *Service) Create(id portainer.EdgeStackID, edgeStack *portainer.EdgeStack) error {
	edgeStack.ID = id

	service.mu.Lock()
	service.idxVersion[id] = edgeStack.Version
	service.cacheInvalidationFn(id)
	service.mu.Unlock()

	return nil
}

// Deprecated: Use UpdateEdgeStackFunc instead.
func (service *Service) UpdateEdgeStack(ID portainer.EdgeStackID, edgeStack *portainer.EdgeStack) error {
	service.mu.Lock()
	defer service.mu.Unlock()

	service.idxVersion[ID] = edgeStack.Version
	service.cacheInvalidationFn(ID)

	return nil
}

// UpdateEdgeStackFunc updates an Edge stack inside a transaction avoiding data races.
func (service *Service) UpdateEdgeStackFunc(ID portainer.EdgeStackID, updateFunc func(edgeStack *portainer.EdgeStack)) error {
	return nil
}

// UpdateEdgeStackFuncTx is a helper function used to call UpdateEdgeStackFunc inside a transaction.
func (service *Service) UpdateEdgeStackFuncTx(tx portainer.Transaction, ID portainer.EdgeStackID, updateFunc func(edgeStack *portainer.EdgeStack)) error {
	return service.Tx(tx).UpdateEdgeStackFunc(ID, updateFunc)
}

// DeleteEdgeStack deletes an Edge stack.
func (service *Service) DeleteEdgeStack(ID portainer.EdgeStackID) error {
	service.mu.Lock()
	defer service.mu.Unlock()

	service.cacheInvalidationFn(ID)

	return nil
}
