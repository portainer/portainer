package edge

import (
	"github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/internal/tag"
)

// EdgeGroupRelatedEndpoints returns a list of environments(endpoints) related to this Edge group
func EdgeGroupRelatedEndpoints(edgeGroup *portainer.EdgeGroup, endpoints []portainer.Endpoint, endpointGroups []portainer.EndpointGroup) []portainer.EndpointID {
	if !edgeGroup.Dynamic {
		return edgeGroup.Endpoints
	}

	endpointIDs := []portainer.EndpointID{}
	for _, endpoint := range endpoints {
		if endpoint.Type != portainer.EdgeAgentOnDockerEnvironment && endpoint.Type != portainer.EdgeAgentOnKubernetesEnvironment {
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

// edgeGroupRelatedToEndpoint returns true is edgeGroup is associated with environment(endpoint)
func edgeGroupRelatedToEndpoint(edgeGroup *portainer.EdgeGroup, endpoint *portainer.Endpoint, endpointGroup *portainer.EndpointGroup) bool {
	if !edgeGroup.Dynamic {
		for _, endpointID := range edgeGroup.Endpoints {
			if endpoint.ID == endpointID {
				return true
			}
		}
		return false
	}

	endpointTags := tag.Set(endpoint.TagIDs)
	if endpointGroup.TagIDs != nil {
		endpointTags = tag.Union(endpointTags, tag.Set(endpointGroup.TagIDs))
	}
	edgeGroupTags := tag.Set(edgeGroup.TagIDs)

	if edgeGroup.PartialMatch {
		intersection := tag.Intersection(endpointTags, edgeGroupTags)
		return len(intersection) != 0
	}

	return tag.Contains(edgeGroupTags, endpointTags)
}
