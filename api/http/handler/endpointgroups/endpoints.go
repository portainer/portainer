package endpointgroups

import portainer "github.com/portainer/portainer/api"

func (handler *Handler) updateEndpointRelations(endpoint portainer.Endpoint, endpointGroup portainer.EndpointGroup) error {
	if endpoint.Type != portainer.EdgeAgentEnvironment {
		return nil
	}
	endpointRelation, err := handler.EndpointRelationService.EndpointRelation(endpoint.ID)
	if err != nil {
		return err
	}

	edgeGroups, err := handler.EdgeGroupService.EdgeGroups()
	if err != nil {
		return err
	}

	edgeStacks, err := handler.EdgeStackService.EdgeStacks()
	if err != nil {
		return err
	}

	endpointStacks := portainer.EndpointRelatedEdgeStacks(endpoint, endpointGroup, edgeGroups, edgeStacks)
	stacksSet := map[portainer.EdgeStackID]bool{}
	for _, edgeStackID := range endpointStacks {
		stacksSet[edgeStackID] = true
	}
	endpointRelation.EdgeStacks = stacksSet

	return handler.EndpointRelationService.UpdateEndpointRelation(endpoint.ID, endpointRelation)
}
