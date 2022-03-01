package migrations

import (
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/datastore/migrations/types"
	"github.com/sirupsen/logrus"
)

func init() {
	migrator.AddMigration(types.Migration{
		Version:   22,
		Timestamp: 1646090838,
		Up:        v22_up_tags_to_23,
		Down:      v22_down_tags_to_23,
		Name:      "tags to 23",
	})
}

func v22_up_tags_to_23() error {
	logrus.Info("Updating tags")
	tags, err := migrator.store.TagService.Tags()
	if err != nil {
		return err
	}

	for _, tag := range tags {
		tag.EndpointGroups = make(map[portainer.EndpointGroupID]bool)
		tag.Endpoints = make(map[portainer.EndpointID]bool)
		err = migrator.store.TagService.UpdateTag(tag.ID, &tag)
		if err != nil {
			return err
		}
	}
	return nil
}

func v22_down_tags_to_23() error {
	return nil
}
