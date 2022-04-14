package migrator

import portainer "github.com/portainer/portainer/api"

func (m *Migrator) updateTagsToDBVersion23() error {
	migrateLog.Info("- Updating tags")
	tags, err := m.tagService.Tags()
	if err != nil {
		return err
	}

	for _, tag := range tags {
		tag.EndpointGroups = make(map[portainer.EndpointGroupID]bool)
		tag.Endpoints = make(map[portainer.EndpointID]bool)
		err = m.tagService.UpdateTag(tag.ID, &tag)
		if err != nil {
			return err
		}
	}
	return nil
}

func (m *Migrator) updateEndpointsAndEndpointGroupsToDBVersion23() error {
	migrateLog.Info("- updating endpoints and endpoint groups")
	tags, err := m.tagService.Tags()
	if err != nil {
		return err
	}

	tagsNameMap := make(map[string]portainer.Tag)
	for _, tag := range tags {
		tagsNameMap[tag.Name] = tag
	}

	endpoints, err := m.endpointService.Endpoints()
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
		err = m.endpointService.UpdateEndpoint(endpoint.ID, &endpoint)
		if err != nil {
			return err
		}

		relation := &portainer.EndpointRelation{
			EndpointID: endpoint.ID,
			EdgeStacks: map[portainer.EdgeStackID]bool{},
		}

		err = m.endpointRelationService.Create(relation)
		if err != nil {
			return err
		}
	}

	endpointGroups, err := m.endpointGroupService.EndpointGroups()
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
		err = m.endpointGroupService.UpdateEndpointGroup(endpointGroup.ID, &endpointGroup)
		if err != nil {
			return err
		}
	}

	for _, tag := range tagsNameMap {
		err = m.tagService.UpdateTag(tag.ID, &tag)
		if err != nil {
			return err
		}
	}
	return nil
}
