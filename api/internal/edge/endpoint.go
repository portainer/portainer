package edge

import (
	"slices"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"

	"github.com/rs/zerolog/log"
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

// EndpointInEdgeGroup returns true and the edge group name if the endpoint is in the edge group
func EndpointInEdgeGroup(
	tx dataservices.DataStoreTx,
	endpointID portainer.EndpointID,
	edgeGroupID portainer.EdgeGroupID,
) (bool, string, error) {
	endpointIDs, err := GetEndpointsFromEdgeGroups(
		[]portainer.EdgeGroupID{edgeGroupID}, tx,
	)
	if err != nil {
		return false, "", err
	}

	if slices.Contains(endpointIDs, endpointID) {
		edgeGroup, err := tx.EdgeGroup().Read(edgeGroupID)
		if err != nil {
			log.Warn().
				Err(err).
				Int("edgeGroupID", int(edgeGroupID)).
				Msg("Unable to retrieve edge group")

			return false, "", err
		}

		return true, edgeGroup.Name, nil
	}

	return false, "", nil
}
