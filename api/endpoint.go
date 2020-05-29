package portainer

// EndpointRelatedEdgeStacks returns a list of Edge stacks related to this Endpoint
func EndpointRelatedEdgeStacks(endpoint *Endpoint, endpointGroup *EndpointGroup, edgeGroups []EdgeGroup, edgeStacks []EdgeStack) []EdgeStackID {
	relatedEdgeGroupsSet := map[EdgeGroupID]bool{}

	for _, edgeGroup := range edgeGroups {
		if edgeGroupRelatedToEndpoint(&edgeGroup, endpoint, endpointGroup) {
			relatedEdgeGroupsSet[edgeGroup.ID] = true
		}
	}

	relatedEdgeStacks := []EdgeStackID{}
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
