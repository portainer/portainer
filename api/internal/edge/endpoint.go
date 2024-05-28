package edge

import (
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
)

// EndpointRelatedEdgeStacks returns a list of Edge stacks related to this Environment(Endpoint)
func EndpointRelatedEdgeStacks(endpoint *portainer.Endpoint, endpointGroup *portainer.EndpointGroup, edgeGroups []portainer.EdgeGroup, edgeStacks []portainer.EdgeStack) []portainer.EdgeStackID {
	relatedEdgeGroupsSet := map[portainer.EdgeGroupID]bool{}

	for _, edgeGroup := range edgeGroups {
		if edgeGroupRelatedToEndpoint(&edgeGroup, endpoint, endpointGroup) {
			relatedEdgeGroupsSet[edgeGroup.ID] = true
		}
	}

	relatedEdgeStacks := []portainer.EdgeStackID{}
	for _, edgeStack := range edgeStacks {
		for _, edgeGroupID := range edgeStack.EdgeGroups {
			if relatedEdgeGroupsSet[edgeGroupID] {
				relatedEdgeStacks = append(relatedEdgeStacks, edgeStack.ID)
				break
			}
		}
	}

	return relatedEdgeStacks
}

func EffectiveCheckinInterval(tx dataservices.DataStoreTx, endpoint *portainer.Endpoint) int {
	if endpoint.EdgeCheckinInterval != 0 {
		return endpoint.EdgeCheckinInterval
	}

	if settings, err := tx.Settings().Settings(); err == nil {
		return settings.EdgeAgentCheckinInterval
	}

	return portainer.DefaultEdgeAgentCheckinIntervalInSeconds
}
