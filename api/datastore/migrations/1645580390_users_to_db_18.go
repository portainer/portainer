package migrations

import (
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/datastore/migrations/types"
)

func init() {
	migrator.AddMigration(types.Migration{
		Version:   0,
		Timestamp: 1645580390,
		Up:        v17_up_users_to_18,
		Down:      v17_down_users_from_18,
		Name:      "Users to 18",
	})
}

func v17_up_users_to_18() error {
	legacyUsers, err := migrator.store.UserService.Users()
	if err != nil {
		return err
	}

	for _, user := range legacyUsers {
		user.PortainerAuthorizations = map[portainer.Authorization]bool{
			portainer.OperationPortainerDockerHubInspect:        true,
			portainer.OperationPortainerEndpointGroupList:       true,
			portainer.OperationPortainerEndpointList:            true,
			portainer.OperationPortainerEndpointInspect:         true,
			portainer.OperationPortainerEndpointExtensionAdd:    true,
			portainer.OperationPortainerEndpointExtensionRemove: true,
			portainer.OperationPortainerExtensionList:           true,
			portainer.OperationPortainerMOTD:                    true,
			portainer.OperationPortainerRegistryList:            true,
			portainer.OperationPortainerRegistryInspect:         true,
			portainer.OperationPortainerTeamList:                true,
			portainer.OperationPortainerTemplateList:            true,
			portainer.OperationPortainerTemplateInspect:         true,
			portainer.OperationPortainerUserList:                true,
			portainer.OperationPortainerUserMemberships:         true,
		}

		err = migrator.store.UserService.UpdateUser(user.ID, &user)
		if err != nil {
			return err
		}
	}
	return nil
}

func v17_down_users_from_18() error {
	return nil
}
