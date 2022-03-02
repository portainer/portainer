package migrations

import (
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/datastore/migrations/types"
	"github.com/sirupsen/logrus"
)

func init() {
	migrator.AddMigration(types.Migration{
		Version:   22,
		Timestamp: 1646091011,
		Up:        v22_up_endpoints_and_endpoint_groups_to_23,
		Down:      v22_down_endpoints_and_endpoint_groups_to_23,
		Name:      "endpoints and endpoint groups to 23",
	})
}

func v22_up_endpoints_and_endpoint_groups_to_23() error {
	logrus.Info("Updating endpoints and endpoint groups")
	tags, err := migrator.store.TagService.Tags()
	if err != nil {
		return err
	}

	tagsNameMap := make(map[string]portainer.Tag)
	for _, tag := range tags {
		tagsNameMap[tag.Name] = tag
	}

	endpoints, err := migrator.store.EndpointService.Endpoints()
	if err != nil {
		return err
	}

	for _, endpoint := range endpoints {
		endpointTags := make([]portainer.TagID, 0)
		for _, tagName := range endpoint.Tags {
			tag, ok := tagsNameMap[tagName]
			if ok {
				endpointTags = append(endpointTags, tag.ID)
				tag.Endpoints[endpoint.ID] = true
			}
		}
		endpoint.TagIDs = endpointTags
		err = migrator.store.EndpointService.UpdateEndpoint(endpoint.ID, &endpoint)
		if err != nil {
			return err
		}

		relation := &portainer.EndpointRelation{
			EndpointID: endpoint.ID,
			EdgeStacks: map[portainer.EdgeStackID]bool{},
		}

		err = migrator.store.EndpointRelationService.Create(relation)
		if err != nil {
			return err
		}
	}

	endpointGroups, err := migrator.store.EndpointGroupService.EndpointGroups()
	if err != nil {
		return err
	}

	for _, endpointGroup := range endpointGroups {
		endpointGroupTags := make([]portainer.TagID, 0)
		for _, tagName := range endpointGroup.Tags {
			tag, ok := tagsNameMap[tagName]
			if ok {
				endpointGroupTags = append(endpointGroupTags, tag.ID)
				tag.EndpointGroups[endpointGroup.ID] = true
			}
		}
		endpointGroup.TagIDs = endpointGroupTags
		err = migrator.store.EndpointGroupService.UpdateEndpointGroup(endpointGroup.ID, &endpointGroup)
		if err != nil {
			return err
		}
	}

	for _, tag := range tagsNameMap {
		err = migrator.store.TagService.UpdateTag(tag.ID, &tag)
		if err != nil {
			return err
		}
	}
	return nil
}

func v22_down_endpoints_and_endpoint_groups_to_23() error {
	return nil
}
