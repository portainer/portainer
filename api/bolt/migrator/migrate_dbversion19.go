package migrator

import portainer "github.com/portainer/portainer/api"

func (m *Migrator) updateUsersToDBVersion20() error {
	legacyUsers, err := m.userService.Users()
	if err != nil {
		return err
	}

	authorizationServiceParameters := &portainer.AuthorizationServiceParameters{
		EndpointService:       m.endpointService,
		EndpointGroupService:  m.endpointGroupService,
		RoleService:           m.roleService,
		TeamMembershipService: m.teamMembershipService,
		UserService:           m.userService,
	}

	authorizationService := portainer.NewAuthorizationService(authorizationServiceParameters)

	for _, user := range legacyUsers {
		err := authorizationService.UpdateUserAuthorizations(user.ID)
		if err != nil {
			return err
		}
	}

	return nil
}
