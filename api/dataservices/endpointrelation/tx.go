package endpointrelation

import (
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	"github.com/portainer/portainer/api/internal/edge/cache"

	"github.com/rs/zerolog/log"
)

type ServiceTx struct {
	service *Service
	tx      portainer.Transaction
}

var _ dataservices.EndpointRelationService = &ServiceTx{}

func (service ServiceTx) BucketName() string {
	return BucketName
}

// EndpointRelations returns an array of all EndpointRelations
func (service ServiceTx) EndpointRelations() ([]portainer.EndpointRelation, error) {
	var all = make([]portainer.EndpointRelation, 0)

	return all, service.tx.GetAll(
		BucketName,
		&portainer.EndpointRelation{},
		dataservices.AppendFn(&all),
	)
}

// EndpointRelation returns an Environment(Endpoint) relation object by EndpointID
func (service ServiceTx) EndpointRelation(endpointID portainer.EndpointID) (*portainer.EndpointRelation, error) {
	var endpointRelation portainer.EndpointRelation
	identifier := service.service.connection.ConvertToKey(int(endpointID))

	if err := service.tx.GetObject(BucketName, identifier, &endpointRelation); err != nil {
		return nil, err
	}

	return &endpointRelation, nil
}

// CreateEndpointRelation saves endpointRelation
func (service ServiceTx) Create(endpointRelation *portainer.EndpointRelation) error {
	err := service.tx.CreateObjectWithId(BucketName, int(endpointRelation.EndpointID), endpointRelation)
	cache.Del(endpointRelation.EndpointID)

	service.service.mu.Lock()
	service.service.endpointRelationsCache = nil
	service.service.mu.Unlock()

	return err
}

// UpdateEndpointRelation updates an Environment(Endpoint) relation object
func (service ServiceTx) UpdateEndpointRelation(endpointID portainer.EndpointID, endpointRelation *portainer.EndpointRelation) error {
	previousRelationState, _ := service.EndpointRelation(endpointID)

	identifier := service.service.connection.ConvertToKey(int(endpointID))
	err := service.tx.UpdateObject(BucketName, identifier, endpointRelation)
	cache.Del(endpointID)
	if err != nil {
		return err
	}

	updatedRelationState, _ := service.EndpointRelation(endpointID)

	service.service.mu.Lock()
	service.service.endpointRelationsCache = nil
	service.service.mu.Unlock()

	service.updateEdgeStacksAfterRelationChange(previousRelationState, updatedRelationState)

	return nil
}

func (service ServiceTx) AddEndpointRelationsForEdgeStack(endpointIDs []portainer.EndpointID, edgeStack *portainer.EdgeStack) error {
	for _, endpointID := range endpointIDs {
		rel, err := service.EndpointRelation(endpointID)
		if err != nil {
			return err
		}

		rel.EdgeStacks[edgeStack.ID] = true

		identifier := service.service.connection.ConvertToKey(int(endpointID))
		err = service.tx.UpdateObject(BucketName, identifier, rel)
		cache.Del(endpointID)
		if err != nil {
			return err
		}
	}

	service.service.mu.Lock()
	service.service.endpointRelationsCache = nil
	service.service.mu.Unlock()

	if err := service.service.updateStackFnTx(service.tx, edgeStack.ID, func(es *portainer.EdgeStack) {
		es.NumDeployments += len(endpointIDs)

		// sync changes in `edgeStack` in case it is re-persisted after `AddEndpointRelationsForEdgeStack` call
		// to avoid overriding with the previous values
		edgeStack.NumDeployments = es.NumDeployments
	}); err != nil {
		log.Error().Err(err).Msg("could not update the number of deployments")
	}

	return nil
}

func (service ServiceTx) RemoveEndpointRelationsForEdgeStack(endpointIDs []portainer.EndpointID, edgeStackID portainer.EdgeStackID) error {
	for _, endpointID := range endpointIDs {
		rel, err := service.EndpointRelation(endpointID)
		if err != nil {
			return err
		}

		delete(rel.EdgeStacks, edgeStackID)

		identifier := service.service.connection.ConvertToKey(int(endpointID))
		err = service.tx.UpdateObject(BucketName, identifier, rel)
		cache.Del(endpointID)
		if err != nil {
			return err
		}
	}

	service.service.mu.Lock()
	service.service.endpointRelationsCache = nil
	service.service.mu.Unlock()

	if err := service.service.updateStackFnTx(service.tx, edgeStackID, func(edgeStack *portainer.EdgeStack) {
		edgeStack.NumDeployments -= len(endpointIDs)
	}); err != nil {
		log.Error().Err(err).Msg("could not update the number of deployments")
	}

	return nil
}

// DeleteEndpointRelation deletes an Environment(Endpoint) relation object
func (service ServiceTx) DeleteEndpointRelation(endpointID portainer.EndpointID) error {
	deletedRelation, _ := service.EndpointRelation(endpointID)

	identifier := service.service.connection.ConvertToKey(int(endpointID))
	err := service.tx.DeleteObject(BucketName, identifier)
	cache.Del(endpointID)
	if err != nil {
		return err
	}

	service.service.mu.Lock()
	service.service.endpointRelationsCache = nil
	service.service.mu.Unlock()

	service.updateEdgeStacksAfterRelationChange(deletedRelation, nil)

	return nil
}

func (service ServiceTx) InvalidateEdgeCacheForEdgeStack(edgeStackID portainer.EdgeStackID) {
	rels, err := service.cachedEndpointRelations()
	if err != nil {
		log.Error().Err(err).Msg("cannot retrieve endpoint relations")
		return
	}

	for _, rel := range rels {
		if _, ok := rel.EdgeStacks[edgeStackID]; ok {
			cache.Del(rel.EndpointID)
		}
	}
}

func (service ServiceTx) cachedEndpointRelations() ([]portainer.EndpointRelation, error) {
	service.service.mu.Lock()
	defer service.service.mu.Unlock()

	if service.service.endpointRelationsCache == nil {
		var err error
		service.service.endpointRelationsCache, err = service.EndpointRelations()
		if err != nil {
			return nil, err
		}
	}

	return service.service.endpointRelationsCache, nil
}

func (service ServiceTx) updateEdgeStacksAfterRelationChange(previousRelationState *portainer.EndpointRelation, updatedRelationState *portainer.EndpointRelation) {
	if previousRelationState != nil {
		for stackId, enabled := range previousRelationState.EdgeStacks {
			// flag stack for update if stack is not in the updated relation state
			// = stack has been removed for this relation
			// or this relation has been deleted
			if enabled && (updatedRelationState == nil || !updatedRelationState.EdgeStacks[stackId]) {
				if err := service.service.updateStackFnTx(service.tx, stackId, func(edgeStack *portainer.EdgeStack) {
					// Sanity check
					if edgeStack.NumDeployments <= 0 {
						log.Error().
							Int("edgestack_id", int(edgeStack.ID)).
							Int("endpoint_id", int(previousRelationState.EndpointID)).
							Int("num_deployments", edgeStack.NumDeployments).
							Msg("cannot decrement the number of deployments for an edge stack with zero deployments")

						return
					}

					edgeStack.NumDeployments--
				}); err != nil {
					log.Error().Err(err).Msg("could not update the number of deployments")
				}

				cache.Del(previousRelationState.EndpointID)
			}
		}
	}

	if updatedRelationState == nil {
		return
	}

	for stackId, enabled := range updatedRelationState.EdgeStacks {
		// flag stack for update if stack is not in the previous relation state
		// = stack has been added for this relation
		if enabled && (previousRelationState == nil || !previousRelationState.EdgeStacks[stackId]) {
			if err := service.service.updateStackFnTx(service.tx, stackId, func(edgeStack *portainer.EdgeStack) {
				edgeStack.NumDeployments++
			}); err != nil {
				log.Error().Err(err).Msg("could not update the number of deployments")
			}

			cache.Del(updatedRelationState.EndpointID)
		}
	}
}
