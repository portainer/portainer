package endpoints

import (
	"github.com/pkg/errors"
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	"github.com/portainer/portainer/api/set"
)

// updateEnvironmentTags updates the tags associated to an environment
func updateEnvironmentTags(tx dataservices.DataStoreTx, newTags []portainer.TagID, oldTags []portainer.TagID, environmentID portainer.EndpointID) (bool, error) {
	payloadTagSet := set.ToSet(newTags)
	environmentTagSet := set.ToSet(oldTags)
	union := set.Union(payloadTagSet, environmentTagSet)
	intersection := set.Intersection(payloadTagSet, environmentTagSet)

	if len(union) <= len(intersection) {
		return false, nil
	}

	updateSet := func(tagIDs set.Set[portainer.TagID], updateItem func(*portainer.Tag)) error {
		for tagID := range tagIDs {
			tag, err := tx.Tag().Read(tagID)
			if err != nil {
				return errors.WithMessage(err, "Unable to find a tag inside the database")
			}

			updateItem(tag)

			err = tx.Tag().Update(tagID, tag)
			if err != nil {
				return errors.WithMessage(err, "Unable to persist tag changes inside the database")
			}
		}

		return nil
	}

	removeTags := environmentTagSet.Difference(payloadTagSet)
	err := updateSet(removeTags, func(tag *portainer.Tag) {
		delete(tag.Endpoints, environmentID)
	})
	if err != nil {
		return false, err
	}

	addTags := payloadTagSet.Difference(environmentTagSet)
	err = updateSet(addTags, func(tag *portainer.Tag) {
		tag.Endpoints[environmentID] = true
	})
	if err != nil {
		return false, err
	}

	return true, nil
}
