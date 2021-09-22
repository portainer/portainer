package edge

import (
	"errors"
	"github.com/portainer/portainer/api"
)

// EdgeStackRelatedEndpoints returns a list of environments(endpoints) related to this Edge stack
func EdgeStackRelatedEndpoints(edgeGroupIDs []portainer.EdgeGroupID, endpoints []portainer.Endpoint, endpointGroups []portainer.EndpointGroup, edgeGroups []portainer.EdgeGroup) ([]portainer.EndpointID, error) {
	edgeStackEndpoints := []portainer.EndpointID{}

	for _, edgeGroupID := range edgeGroupIDs {
		var edgeGroup *portainer.EdgeGroup

		for _, group := range edgeGroups {
			if group.ID == edgeGroupID {
				edgeGroup = &group
				break
			}
		}

		if edgeGroup == nil {
			return nil, errors.New("Edge group was not found")
		}

		edgeStackEndpoints = append(edgeStackEndpoints, EdgeGroupRelatedEndpoints(edgeGroup, endpoints, endpointGroups)...)
	}

	return edgeStackEndpoints, nil
}
