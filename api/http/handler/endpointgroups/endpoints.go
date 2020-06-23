package endpointgroups

import portainer "github.com/portainer/portainer/api"

func (handler *Handler) updateEndpointRelations(endpoint *portainer.Endpoint, endpointGroup *portainer.EndpointGroup) error {
	if endpoint.Type != portainer.EdgeAgentEnvironment {
		return nil
	}

	if endpointGroup == nil {
		unassignedGroup, err := handler.DataStore.EndpointGroup().EndpointGroup(portainer.EndpointGroupID(1))
		if err != nil {
			return err
		}

		endpointGroup = unassignedGroup
	}

	endpointRelation, err := handler.DataStore.EndpointRelation().EndpointRelation(endpoint.ID)
	if err != nil {
		return err
	}

	edgeGroups, err := handler.DataStore.EdgeGroup().EdgeGroups()
	if err != nil {
		return err
	}

	edgeStacks, err := handler.DataStore.EdgeStack().EdgeStacks()
	if err != nil {
		return err
	}

	endpointStacks := portainer.EndpointRelatedEdgeStacks(endpoint, endpointGroup, edgeGroups, edgeStacks)
	stacksSet := map[portainer.EdgeStackID]bool{}
	for _, edgeStackID := range endpointStacks {
		stacksSet[edgeStackID] = true
	}
	endpointRelation.EdgeStacks = stacksSet

	return handler.DataStore.EndpointRelation().UpdateEndpointRelation(endpoint.ID, endpointRelation)
}
