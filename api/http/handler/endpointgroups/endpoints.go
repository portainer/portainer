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

	edgeGroups, err := handler.DataStore.EdgeGroup().EdgeGroups()
	if err != nil {
		return err
	}

	edgeStacks, err := handler.DataStore.EdgeStack().EdgeStacks()
	if err != nil {
		return err
	}

	endpointStacks := edge.EndpointRelatedEdgeStacks(endpoint, endpointGroup, edgeGroups, edgeStacks)
	stacksSet := map[portainer.EdgeStackID]bool{}
	for _, edgeStackID := range endpointStacks {
		stacksSet[edgeStackID] = true
	}

	return handler.DataStore.EndpointRelation().UpdateEndpointRelationFunc(endpoint.ID, func(relation *portainer.EndpointRelation) {
		relation.EdgeStacks = stacksSet
	})
}
