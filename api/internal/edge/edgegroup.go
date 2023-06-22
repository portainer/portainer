package edge

import (
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	"github.com/portainer/portainer/api/internal/endpointutils"
	"github.com/portainer/portainer/api/internal/tag"
)

// EdgeGroupRelatedEndpoints returns a list of environments(endpoints) related to this Edge group
func EdgeGroupRelatedEndpoints(edgeGroup *portainer.EdgeGroup, endpoints []portainer.Endpoint, endpointGroups []portainer.EndpointGroup) []portainer.EndpointID {
	if !edgeGroup.Dynamic {
		return edgeGroup.Endpoints
	}

	endpointIDs := []portainer.EndpointID{}
	for _, endpoint := range endpoints {
		if !endpointutils.IsEdgeEndpoint(&endpoint) {
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

func EdgeGroupSet(edgeGroupIDs []portainer.EdgeGroupID) map[portainer.EdgeGroupID]bool {
	set := map[portainer.EdgeGroupID]bool{}

	for _, edgeGroupID := range edgeGroupIDs {
		set[edgeGroupID] = true
	}

	return set
}

func GetEndpointsFromEdgeGroups(edgeGroupIDs []portainer.EdgeGroupID, datastore dataservices.DataStoreTx) ([]portainer.EndpointID, error) {
	endpoints, err := datastore.Endpoint().Endpoints()
	if err != nil {
		return nil, err
	}

	endpointGroups, err := datastore.EndpointGroup().ReadAll()
	if err != nil {
		return nil, err
	}

	var response []portainer.EndpointID
	for _, edgeGroupID := range edgeGroupIDs {
		edgeGroup, err := datastore.EdgeGroup().Read(edgeGroupID)
		if err != nil {
			return nil, err
		}

		response = append(response, EdgeGroupRelatedEndpoints(edgeGroup, endpoints, endpointGroups)...)
	}

	return response, nil
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
