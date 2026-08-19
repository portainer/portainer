package endpoints

import (
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	"github.com/portainer/portainer/api/set"

	"github.com/pkg/errors"
)

func updateEnvironmentEdgeGroups(tx dataservices.DataStoreTx, newEdgeGroups []portainer.EdgeGroupID, environmentID portainer.EndpointID) (bool, error) {
	edgeGroups, err := tx.EdgeGroup().ReadAll()
	if err != nil {
		return false, errors.WithMessage(err, "Unable to retrieve edge groups from the database")
	}

	newEdgeGroupsSet := set.ToSet(newEdgeGroups)

	environmentEdgeGroupsSet := set.Set[portainer.EdgeGroupID]{}
	for _, edgeGroup := range edgeGroups {
		if edgeGroup.EndpointIDs.Contains(environmentID) {
			environmentEdgeGroupsSet[edgeGroup.ID] = true
		}
	}

	union := set.Union(newEdgeGroupsSet, environmentEdgeGroupsSet)
	intersection := set.Intersection(newEdgeGroupsSet, environmentEdgeGroupsSet)

	if len(union) <= len(intersection) {
		return false, nil
	}

	updateSet := func(groupIDs set.Set[portainer.EdgeGroupID], updateItem func(*portainer.EdgeGroup)) error {
		for groupID := range groupIDs {
			group, err := tx.EdgeGroup().Read(groupID)
			if err != nil {
				return errors.WithMessage(err, "Unable to find a Edge group inside the database")
			}

			updateItem(group)

			err = tx.EdgeGroup().Update(groupID, group)
			if err != nil {
				return errors.WithMessage(err, "Unable to persist Edge group changes inside the database")
			}
		}

		return nil
	}

	removeEdgeGroups := environmentEdgeGroupsSet.Difference(newEdgeGroupsSet)
	if err := updateSet(removeEdgeGroups, func(edgeGroup *portainer.EdgeGroup) {
		edgeGroup.EndpointIDs.Remove(environmentID)
	}); err != nil {
		return false, err
	}

	addToEdgeGroups := newEdgeGroupsSet.Difference(environmentEdgeGroupsSet)
	if err := updateSet(addToEdgeGroups, func(edgeGroup *portainer.EdgeGroup) {
		edgeGroup.EndpointIDs.Add(environmentID)
	}); err != nil {
		return false, err
	}

	return true, nil
}
