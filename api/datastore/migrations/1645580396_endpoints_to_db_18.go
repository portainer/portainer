package migrations

import (
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/datastore/migrations/types"
)

func init() {
	migrator.AddMigration(types.Migration{
		Version:   17,
		Timestamp: 1645580396,
		Up:        v17_up_endpoints_to_18,
		Down:      v17_down_endpoints_from_18,
		Name:      "Endpoints to 18",
	})
}

func v17_up_endpoints_to_18() error {
	legacyEndpoints, err := migrator.store.EndpointService.Endpoints()
	if err != nil {
		return err
	}

	for _, endpoint := range legacyEndpoints {
		endpoint.UserAccessPolicies = make(portainer.UserAccessPolicies)
		for _, userID := range endpoint.AuthorizedUsers {
			endpoint.UserAccessPolicies[userID] = portainer.AccessPolicy{
				RoleID: 4,
			}
		}

		endpoint.TeamAccessPolicies = make(portainer.TeamAccessPolicies)
		for _, teamID := range endpoint.AuthorizedTeams {
			endpoint.TeamAccessPolicies[teamID] = portainer.AccessPolicy{
				RoleID: 4,
			}
		}

		err = migrator.store.EndpointService.UpdateEndpoint(endpoint.ID, &endpoint)
		if err != nil {
			return err
		}
	}

	return nil
}

func v17_down_endpoints_from_18() error {
	return nil
}
