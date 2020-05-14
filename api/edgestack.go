package portainer

import "errors"

// EdgeStackRelatedEndpoints returns a list of endpoints related to this Edge stack
func EdgeStackRelatedEndpoints(edgeGroupIDs []EdgeGroupID, endpoints []Endpoint, endpointGroups []EndpointGroup, edgeGroups []EdgeGroup) ([]EndpointID, error) {
	edgeStackEndpoints := []EndpointID{}

	for _, edgeGroupID := range edgeGroupIDs {
		var edgeGroup *EdgeGroup

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
