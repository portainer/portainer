package migrator

import (
	"github.com/pkg/errors"
	portainer "github.com/portainer/portainer/api"
	perrors "github.com/portainer/portainer/api/dataservices/errors"
	"github.com/portainer/portainer/api/internal/endpointutils"
)

func (m *Migrator) addEndpointRelationForEdgeAgents_2_32_0() error {
	endpoints, err := m.endpointService.Endpoints()
	if err != nil {
		return err
	}

	for _, endpoint := range endpoints {
		if endpointutils.IsEdgeEndpoint(&endpoint) {
			_, err := m.endpointRelationService.EndpointRelation(endpoint.ID)
			if err != nil && errors.Is(err, perrors.ErrObjectNotFound) {
				relation := &portainer.EndpointRelation{
					EndpointID: endpoint.ID,
					EdgeStacks: make(map[portainer.EdgeStackID]bool),
				}

				if err := m.endpointRelationService.Create(relation); err != nil {
					return err
				}
			}
		}
	}

	return nil
}
