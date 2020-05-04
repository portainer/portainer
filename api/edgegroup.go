package portainer

// EdgeGroupRelatedEndpoints returns a list of endpoints related to this Edge group
func EdgeGroupRelatedEndpoints(edgeGroup *EdgeGroup, endpoints []Endpoint, endpointGroups []EndpointGroup) []EndpointID {
	if !edgeGroup.Dynamic {
		return edgeGroup.Endpoints
	}

	endpointIDs := []EndpointID{}
	for _, endpoint := range endpoints {
		if endpoint.Type != EdgeAgentEnvironment {
			continue
		}

		var endpointGroup EndpointGroup
		for _, group := range endpointGroups {
			if endpoint.GroupID == group.ID {
				endpointGroup = group
				break
			}
		}

		if edgeGroupRelatedToEndpoint(edgeGroup, &endpoint, &endpointGroup) {
			endpointIDs = append(endpointIDs, endpoint.ID)
		}
	}

	return endpointIDs
}

// edgeGroupRelatedToEndpoint returns true is edgeGroup is associated with endpoint
func edgeGroupRelatedToEndpoint(edgeGroup *EdgeGroup, endpoint *Endpoint, endpointGroup *EndpointGroup) bool {
	if !edgeGroup.Dynamic {
		for _, endpointID := range edgeGroup.Endpoints {
			if endpoint.ID == endpointID {
				return true
			}
		}
		return false
	}

	endpointTags := TagSet(endpoint.TagIDs)
	if endpointGroup.TagIDs != nil {
		endpointTags = TagUnion(endpointTags, TagSet(endpointGroup.TagIDs))
	}
	edgeGroupTags := TagSet(edgeGroup.TagIDs)

	if edgeGroup.PartialMatch {
		intersection := TagIntersection(endpointTags, edgeGroupTags)
		return len(intersection) != 0
	}

	return TagContains(edgeGroupTags, endpointTags)
}
