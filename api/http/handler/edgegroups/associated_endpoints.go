package edgegroups

import (
	"github.com/portainer/portainer/api"
)

type endpointSetType map[portainer.EndpointID]bool

func (handler *Handler) getEndpointsByTags(tagIDs []portainer.TagID, partialMatch bool) ([]portainer.EndpointID, error) {
	if len(tagIDs) == 0 {
		return []portainer.EndpointID{}, nil
	}

	endpoints, err := handler.DataStore.Endpoint().Endpoints()
	if err != nil {
		return nil, err
	}

	groupEndpoints := mapEndpointGroupToEndpoints(endpoints)

	tags := []portainer.Tag{}
	for _, tagID := range tagIDs {
		tag, err := handler.DataStore.Tag().Tag(tagID)
		if err != nil {
			return nil, err
		}
		tags = append(tags, *tag)
	}

	setsOfEndpoints := mapTagsToEndpoints(tags, groupEndpoints)

	var endpointSet endpointSetType
	if partialMatch {
		endpointSet = setsUnion(setsOfEndpoints)
	} else {
		endpointSet = setsIntersection(setsOfEndpoints)
	}

	results := []portainer.EndpointID{}
	for _, endpoint := range endpoints {
		if _, ok := endpointSet[endpoint.ID]; ok && (endpoint.Type == portainer.EdgeAgentOnDockerEnvironment || endpoint.Type == portainer.EdgeAgentOnKubernetesEnvironment) {
			results = append(results, endpoint.ID)
		}
	}

	return results, nil
}

func mapEndpointGroupToEndpoints(endpoints []portainer.Endpoint) map[portainer.EndpointGroupID]endpointSetType {
	groupEndpoints := map[portainer.EndpointGroupID]endpointSetType{}
	for _, endpoint := range endpoints {
		groupID := endpoint.GroupID
		if groupEndpoints[groupID] == nil {
			groupEndpoints[groupID] = endpointSetType{}
		}
		groupEndpoints[groupID][endpoint.ID] = true
	}
	return groupEndpoints
}

func mapTagsToEndpoints(tags []portainer.Tag, groupEndpoints map[portainer.EndpointGroupID]endpointSetType) []endpointSetType {
	sets := []endpointSetType{}
	for _, tag := range tags {
		set := tag.Endpoints
		for groupID := range tag.EndpointGroups {
			for endpointID := range groupEndpoints[groupID] {
				set[endpointID] = true
			}
		}
		sets = append(sets, set)
	}

	return sets
}

func setsIntersection(sets []endpointSetType) endpointSetType {
	if len(sets) == 0 {
		return endpointSetType{}
	}

	intersectionSet := sets[0]

	for _, set := range sets {
		for endpointID := range intersectionSet {
			if !set[endpointID] {
				delete(intersectionSet, endpointID)
			}
		}
	}

	return intersectionSet
}

func setsUnion(sets []endpointSetType) endpointSetType {
	unionSet := endpointSetType{}

	for _, set := range sets {
		for endpointID := range set {
			unionSet[endpointID] = true
		}
	}

	return unionSet
}
