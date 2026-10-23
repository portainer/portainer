package endpointutils

import (
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	"github.com/portainer/portainer/api/set"
)

// GetEndpointsByTags returns the trusted edge endpoints matching tagIDs, unioned if partialMatch
// is set or intersected otherwise.
func GetEndpointsByTags(tx dataservices.DataStoreTx, tagIDs []portainer.TagID, partialMatch bool) ([]portainer.EndpointID, error) {
	if len(tagIDs) == 0 {
		return []portainer.EndpointID{}, nil
	}

	endpoints, err := tx.Endpoint().Endpoints()
	if err != nil {
		return nil, err
	}

	groupEndpoints := mapEndpointGroupToEndpoints(endpoints)

	tags := []portainer.Tag{}
	for _, tagID := range tagIDs {
		tag, err := tx.Tag().Read(tagID)
		if err != nil {
			return nil, err
		}

		tags = append(tags, *tag)
	}

	setsOfEndpoints := mapTagsToEndpoints(tags, groupEndpoints)

	var endpointSet set.Set[portainer.EndpointID]
	if partialMatch {
		endpointSet = set.Union(setsOfEndpoints...)
	} else {
		endpointSet = set.Intersection(setsOfEndpoints...)
	}

	results := []portainer.EndpointID{}
	for _, endpoint := range endpoints {
		if endpointSet.Contains(endpoint.ID) && IsEdgeEndpoint(&endpoint) && endpoint.UserTrusted {
			results = append(results, endpoint.ID)
		}
	}

	return results, nil
}

func mapEndpointGroupToEndpoints(endpoints []portainer.Endpoint) map[portainer.EndpointGroupID]set.Set[portainer.EndpointID] {
	groupEndpoints := map[portainer.EndpointGroupID]set.Set[portainer.EndpointID]{}

	for _, endpoint := range endpoints {
		groupID := endpoint.GroupID
		if groupEndpoints[groupID] == nil {
			groupEndpoints[groupID] = set.Set[portainer.EndpointID]{}
		}

		groupEndpoints[groupID].Add(endpoint.ID)
	}

	return groupEndpoints
}

func mapTagsToEndpoints(tags []portainer.Tag, groupEndpoints map[portainer.EndpointGroupID]set.Set[portainer.EndpointID]) []set.Set[portainer.EndpointID] {
	sets := make([]set.Set[portainer.EndpointID], 0, len(tags))

	for _, tag := range tags {
		s := set.Set[portainer.EndpointID](tag.Endpoints)

		for groupID := range tag.EndpointGroups {
			for endpointID := range groupEndpoints[groupID] {
				s.Add(endpointID)
			}
		}

		sets = append(sets, s)
	}

	return sets
}
