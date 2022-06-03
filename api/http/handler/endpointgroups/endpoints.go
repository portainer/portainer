package endpointgroups

import (
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/internal/edge"
)

func (handler *Handler) updateEndpointRelations(endpoint *portainer.Endpoint, endpointGroup *portainer.EndpointGroup) error {
	if endpoint.Type != portainer.EdgeAgentOnKubernetesEnvironment && endpoint.Type != portainer.EdgeAgentOnDockerEnvironment {
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

	endpointStacks := edge.EndpointRelatedEdgeStacks(endpoint, endpointGroup, edgeGroups, edgeStacks)
	updatedStacks := make(map[portainer.EdgeStackID]portainer.EdgeStackStatus)

	for _, edgeStackID := range endpointStacks {
		updatedStacks[edgeStackID] = endpointRelation.EdgeStacks[edgeStackID]
	}
	endpointRelation.EdgeStacks = updatedStacks

	return handler.DataStore.EndpointRelation().UpdateEndpointRelation(endpoint.ID, endpointRelation)
}
