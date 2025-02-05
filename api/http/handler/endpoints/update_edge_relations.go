package endpoints

import (
	"github.com/pkg/errors"
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	"github.com/portainer/portainer/api/internal/edge"
	"github.com/portainer/portainer/api/internal/endpointutils"
	"github.com/portainer/portainer/api/set"
)

// updateEdgeRelations updates the edge stacks associated to an edge endpoint
func (handler *Handler) updateEdgeRelations(tx dataservices.DataStoreTx, endpoint *portainer.Endpoint) error {
	if !endpointutils.IsEdgeEndpoint(endpoint) {
		return nil
	}

	relation, err := tx.EndpointRelation().EndpointRelation(endpoint.ID)
	if err != nil {
		if !tx.IsErrObjectNotFound(err) {
			return errors.WithMessage(err, "Unable to retrieve environment relation inside the database")
		}

		relation = &portainer.EndpointRelation{
			EndpointID: endpoint.ID,
			EdgeStacks: map[portainer.EdgeStackID]bool{},
		}
		if err := tx.EndpointRelation().Create(relation); err != nil {
			return errors.WithMessage(err, "Unable to create environment relation inside the database")
		}
	}

	endpointGroup, err := tx.EndpointGroup().Read(endpoint.GroupID)
	if err != nil {
		return errors.WithMessage(err, "Unable to find environment group inside the database")
	}

	edgeGroups, err := tx.EdgeGroup().ReadAll()
	if err != nil {
		return errors.WithMessage(err, "Unable to retrieve edge groups from the database")
	}

	edgeStacks, err := tx.EdgeStack().EdgeStacks()
	if err != nil {
		return errors.WithMessage(err, "Unable to retrieve edge stacks from the database")
	}

	currentEdgeStackSet := set.ToSet(edge.EndpointRelatedEdgeStacks(endpoint, endpointGroup, edgeGroups, edgeStacks))

	relation.EdgeStacks = currentEdgeStackSet

	err = tx.EndpointRelation().UpdateEndpointRelation(endpoint.ID, relation)
	if err != nil {
		return errors.WithMessage(err, "Unable to persist environment relation changes inside the database")
	}

	return nil
}
