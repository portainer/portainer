package edge

import (
	"errors"
	"fmt"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
)

var ErrEdgeGroupNotFound = errors.New("edge group was not found")

// EdgeStackRelatedEndpoints returns a list of environments(endpoints) related to this Edge stack
func EdgeStackRelatedEndpoints(edgeGroupIDs []portainer.EdgeGroupID, endpoints []portainer.Endpoint, endpointGroups []portainer.EndpointGroup, edgeGroups []portainer.EdgeGroup) ([]portainer.EndpointID, error) {
	edgeStackEndpoints := []portainer.EndpointID{}

	for _, edgeGroupID := range edgeGroupIDs {
		var edgeGroup *portainer.EdgeGroup

		for _, group := range edgeGroups {
			group := group
			if group.ID == edgeGroupID {
				edgeGroup = &group
				break
			}
		}

		if edgeGroup == nil {
			return nil, ErrEdgeGroupNotFound
		}

		edgeStackEndpoints = append(edgeStackEndpoints, EdgeGroupRelatedEndpoints(edgeGroup, endpoints, endpointGroups)...)
	}

	return edgeStackEndpoints, nil
}

type EndpointRelationsConfig struct {
	Endpoints      []portainer.Endpoint
	EndpointGroups []portainer.EndpointGroup
	EdgeGroups     []portainer.EdgeGroup
}

// FetchEndpointRelationsConfig fetches config needed for Edge Stack related endpoints
func FetchEndpointRelationsConfig(tx dataservices.DataStoreTx) (*EndpointRelationsConfig, error) {
	endpoints, err := tx.Endpoint().Endpoints()
	if err != nil {
		return nil, fmt.Errorf("unable to retrieve environments from database: %w", err)
	}

	endpointGroups, err := tx.EndpointGroup().ReadAll()
	if err != nil {
		return nil, fmt.Errorf("unable to retrieve environment groups from database: %w", err)
	}

	edgeGroups, err := tx.EdgeGroup().ReadAll()
	if err != nil {
		return nil, fmt.Errorf("unable to retrieve edge groups from database: %w", err)
	}

	return &EndpointRelationsConfig{
		Endpoints:      endpoints,
		EndpointGroups: endpointGroups,
		EdgeGroups:     edgeGroups,
	}, nil
}
