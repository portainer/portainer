package bolt

func (m *Migrator) updateEndpointsToVersion12() error {
	legacyEndpoints, err := m.EndpointService.Endpoints()
	if err != nil {
		return err
	}

	for _, endpoint := range legacyEndpoints {
		endpoint.Tags = []string{}

		err = m.EndpointService.UpdateEndpoint(endpoint.ID, &endpoint)
		if err != nil {
			return err
		}
	}

	return nil
}

func (m *Migrator) updateEndpointGroupsToVersion12() error {
	legacyEndpointGroups, err := m.EndpointGroupService.EndpointGroups()
	if err != nil {
		return err
	}

	for _, group := range legacyEndpointGroups {
		group.Tags = []string{}

		err = m.EndpointGroupService.UpdateEndpointGroup(group.ID, &group)
		if err != nil {
			return err
		}
	}

	return nil
}
