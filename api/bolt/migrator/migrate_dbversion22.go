package migrator

import "github.com/portainer/portainer/api"

func (m *Migrator) updateTagsToDBVersion23() error {
	// create association objects to each tag
	tags, err := m.tagService.Tags()
	if err != nil {
		return err
	}

	for _, tag := range tags {
		tagAssociation := &portainer.TagAssociation{
			TagID: tag.ID,
		}
		err = m.tagAssociationService.CreateTagAssociation(tagAssociation)
		if err != nil {
			return err
		}
	}
	return nil
}

func (m *Migrator) updateEndpointsAndEndpointGroupsToDBVersion23() error {
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
			tagID, ok := tagsNameMap[tagName]
			if ok {
				endpointTags = append(endpointTags, tagID)
			}
		}
		endpoint.TagIDs = endpointTags
		err = m.endpointService.UpdateEndpoint(endpoint.ID, &endpoint)
		if err != nil {
			return err
		}
	}

	tagSet := make(map[portainer.TagID]bool)
	tagEndpointsMap := make(map[portainer.TagID][]portainer.EndpointID)
	for _, endpoint := range endpoints {
		for _, tagID := range endpoint.TagIDs {
			if _, ok := tagEndpointsMap[tagID]; !ok {
				tagEndpointsMap[tagID] = make([]portainer.EndpointID, 0)
			}
			tagEndpointsMap[tagID] = append(tagEndpointsMap[tagID], endpoint.ID)
			tagSet[tagID] = true
		}
	}

	endpointGroups, err := m.endpointGroupService.EndpointGroups()
	if err != nil {
		return err
	}

	for _, endpointGroup := range endpointGroups {
		endpointGroupTags := make([]portainer.TagID, 0)
		for _, tagName := range endpointGroup.Tags {
			tagID, ok := tagsNameMap[tagName]
			if ok {
				endpointGroupTags = append(endpointGroupTags, tagID)
			}
		}
		endpointGroup.TagIDs = endpointGroupTags
		err = m.endpointGroupService.UpdateEndpointGroup(endpointGroup.ID, &endpointGroup)
		if err != nil {
			return err
		}
	}

	tagEndpointGroupsMap := make(map[portainer.TagID][]portainer.EndpointGroupID)

	for _, endpointGroup := range endpointGroups {
		for _, tagID := range endpointGroup.TagIDs {
			if _, ok := tagEndpointGroupsMap[tagID]; !ok {
				tagEndpointGroupsMap[tagID] = make([]portainer.EndpointGroupID, 0)
			}
			tagEndpointGroupsMap[tagID] = append(tagEndpointGroupsMap[tagID], endpointGroup.ID)
			tagSet[tagID] = true
		}
	}

	for tagID := range tagSet {
		tagAssociation, err := m.tagAssociationService.TagAssociationByTagID(tagID)
		if err != nil {
			return err
		}

		if endpointsIDs, ok := tagEndpointsMap[tagID]; ok {
			for _, endpointID := range endpointsIDs {
				tagAssociation.Endpoints[endpointID] = true
			}
		}

		if endpointGroupsIDs, ok := tagEndpointGroupsMap[tagID]; ok {
			for _, endpointGroupID := range endpointGroupsIDs {
				tagAssociation.EndpointGroups[endpointGroupID] = true
			}
		}
		m.tagAssociationService.UpdateTagAssociation(tagID, tagAssociation)
	}

	return nil
}
