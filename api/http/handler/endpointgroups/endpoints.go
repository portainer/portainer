package endpointgroups

import (
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	"github.com/portainer/portainer/api/internal/edge"
)

func (handler *Handler) updateEndpointRelations(tx dataservices.DataStoreTx, endpoint *portainer.Endpoint, endpointGroup *portainer.EndpointGroup) error {
	if endpoint.Type != portainer.EdgeAgentOnKubernetesEnvironment && endpoint.Type != portainer.EdgeAgentOnDockerEnvironment {
		return nil
	}

	if endpointGroup == nil {
		unassignedGroup, err := tx.EndpointGroup().Read(portainer.EndpointGroupID(1))
		if err != nil {
			return err
		}

		endpointGroup = unassignedGroup
	}

	endpointRelation, err := tx.EndpointRelation().EndpointRelation(endpoint.ID)
	if err != nil {
		return err
	}

	edgeGroups, err := tx.EdgeGroup().ReadAll()
	if err != nil {
		return err
	}

	edgeStacks, err := tx.EdgeStack().EdgeStacks()
	if err != nil {
		return err
	}

	endpointStacks := edge.EndpointRelatedEdgeStacks(endpoint, endpointGroup, edgeGroups, edgeStacks)
	stacksSet := map[portainer.EdgeStackID]bool{}
	for _, edgeStackID := range endpointStacks {
		stacksSet[edgeStackID] = true
	}
	endpointRelation.EdgeStacks = stacksSet

	return tx.EndpointRelation().UpdateEndpointRelation(endpoint.ID, endpointRelation)
}
