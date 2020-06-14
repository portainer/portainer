package edge

import "github.com/portainer/portainer/api"

// EdgeGroupRelatedEndpoints returns a list of endpoints related to this Edge group
func EdgeGroupRelatedEndpoints(edgeGroup *portainer.EdgeGroup, endpoints []portainer.Endpoint, endpointGroups []portainer.EndpointGroup) []portainer.EndpointID {
	if !edgeGroup.Dynamic {
		return edgeGroup.Endpoints
	}

	endpointIDs := []portainer.EndpointID{}
	for _, endpoint := range endpoints {
		if endpoint.Type != portainer.EdgeAgentEnvironment {
			continue
		}

		var endpointGroup portainer.EndpointGroup
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
func edgeGroupRelatedToEndpoint(edgeGroup *portainer.EdgeGroup, endpoint *portainer.Endpoint, endpointGroup *portainer.EndpointGroup) bool {
	if !edgeGroup.Dynamic {
		for _, endpointID := range edgeGroup.Endpoints {
			if endpoint.ID == endpointID {
				return true
			}
		}
		return false
	}

	endpointTags := portainer.TagSet(endpoint.TagIDs)
	if endpointGroup.TagIDs != nil {
		endpointTags = portainer.TagUnion(endpointTags, portainer.TagSet(endpointGroup.TagIDs))
	}
	edgeGroupTags := portainer.TagSet(edgeGroup.TagIDs)

	if edgeGroup.PartialMatch {
		intersection := portainer.TagIntersection(endpointTags, edgeGroupTags)
		return len(intersection) != 0
	}

	return portainer.TagContains(edgeGroupTags, endpointTags)
}
