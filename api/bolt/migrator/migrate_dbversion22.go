package migrator

import portainer "github.com/portainer/portainer/api"

func (m *Migrator) updateEndointsAndEndpointsGroupsToDBVersion23() error {

	tags, err := m.tagService.Tags()

	if err != nil {
		return err
	}

	tagsNameMap := make(map[string]portainer.TagID)
	for _, tag := range tags {
		tagsNameMap[tag.Name] = tag.ID
	}

	endpoints, err := m.endpointService.Endpoints()
	if err != nil {
		return err
	}

	for _, endpoint := range endpoints {
		endpointTags := make([]portainer.TagID, 0)
		for _, tagName := range endpoint.Tags {
			tagID := tagsNameMap[tagName]
			endpointTags = append(endpointTags, tagID)
		}
		endpoint.TagIDs = endpointTags
		m.endpointService.UpdateEndpoint(endpoint.ID, &endpoint)
	}

	endpointGroups, err := m.endpointGroupService.EndpointGroups()
	if err != nil {
		return err
	}

	for _, endpointGroup := range endpointGroups {
		endpointGroupTags := make([]portainer.TagID, 0)
		for _, tagName := range endpointGroup.Tags {
			tagID := tagsNameMap[tagName]
			endpointGroupTags = append(endpointGroupTags, tagID)
		}
		endpointGroup.TagIDs = endpointGroupTags
		m.endpointGroupService.UpdateEndpointGroup(endpointGroup.ID, &endpointGroup)
	}

	return nil
}
