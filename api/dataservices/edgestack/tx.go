package edgestack

import (
	portainer "github.com/portainer/portainer/api"
)

type ServiceTx struct {
	service *Service
	tx      portainer.Transaction
}

func (service ServiceTx) BucketName() string {
	return BucketName
}

// EdgeStacks returns an array containing all edge stacks
func (service ServiceTx) EdgeStacks() ([]portainer.EdgeStack, error) {
	var stacks = make([]portainer.EdgeStack, 0)

	return stacks, nil
}

// EdgeStack returns an Edge stack by ID.
func (service ServiceTx) EdgeStack(ID portainer.EdgeStackID) (*portainer.EdgeStack, error) {
	var stack portainer.EdgeStack

	return &stack, nil
}

// EdgeStackVersion returns the version of the given edge stack ID directly from an in-memory index
func (service ServiceTx) EdgeStackVersion(ID portainer.EdgeStackID) (int, bool) {
	service.service.mu.RLock()
	v, ok := service.service.idxVersion[ID]
	service.service.mu.RUnlock()

	return v, ok
}

// CreateEdgeStack saves an Edge stack object to db.
func (service ServiceTx) Create(id portainer.EdgeStackID, edgeStack *portainer.EdgeStack) error {
	edgeStack.ID = id

	service.service.mu.Lock()
	service.service.idxVersion[id] = edgeStack.Version
	service.service.cacheInvalidationFn(id)
	service.service.mu.Unlock()

	return nil
}

// UpdateEdgeStack updates an Edge stack.
func (service ServiceTx) UpdateEdgeStack(ID portainer.EdgeStackID, edgeStack *portainer.EdgeStack) error {
	service.service.mu.Lock()
	defer service.service.mu.Unlock()

	service.service.idxVersion[ID] = edgeStack.Version
	service.service.cacheInvalidationFn(ID)

	return nil
}

// Deprecated: use UpdateEdgeStack inside a transaction instead.
func (service ServiceTx) UpdateEdgeStackFunc(ID portainer.EdgeStackID, updateFunc func(edgeStack *portainer.EdgeStack)) error {
	edgeStack, err := service.EdgeStack(ID)
	if err != nil {
		return err
	}

	updateFunc(edgeStack)

	return service.UpdateEdgeStack(ID, edgeStack)
}

// DeleteEdgeStack deletes an Edge stack.
func (service ServiceTx) DeleteEdgeStack(ID portainer.EdgeStackID) error {
	service.service.mu.Lock()
	defer service.service.mu.Unlock()
	return nil
}
