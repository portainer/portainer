package migrations

import (
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/datastore/migrations/types"
)

func init() {
	migrator.AddMigration(types.Migration{
		Version:   17,
		Timestamp: 1645580400,
		Up:        v17_up_endpoints_groups_to_18,
		Down:      v17_down_endpoints_groups_from_18,
		Name:      "Endpoints groups to 18",
	})
}

func v17_up_endpoints_groups_to_18() error {
	legacyEndpointGroups, err := migrator.store.EndpointGroupService.EndpointGroups()
	if err != nil {
		return err
	}

	for _, endpointGroup := range legacyEndpointGroups {
		endpointGroup.UserAccessPolicies = make(portainer.UserAccessPolicies)
		for _, userID := range endpointGroup.AuthorizedUsers {
			endpointGroup.UserAccessPolicies[userID] = portainer.AccessPolicy{
				RoleID: 4,
			}
		}

		endpointGroup.TeamAccessPolicies = make(portainer.TeamAccessPolicies)
		for _, teamID := range endpointGroup.AuthorizedTeams {
			endpointGroup.TeamAccessPolicies[teamID] = portainer.AccessPolicy{
				RoleID: 4,
			}
		}

		err = migrator.store.EndpointGroupService.UpdateEndpointGroup(endpointGroup.ID, &endpointGroup)
		if err != nil {
			return err
		}
	}

	return nil
}

func v17_down_endpoints_groups_from_18() error {
	return nil
}
