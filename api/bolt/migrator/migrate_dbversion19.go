package migrator

import portainer "github.com/portainer/portainer/api"

func (m *Migrator) updateUsersToDBVersion20() error {
	authorizationServiceParameters := &portainer.AuthorizationServiceParameters{
		EndpointService:       m.endpointService,
		EndpointGroupService:  m.endpointGroupService,
		RegistryService:       m.registryService,
		RoleService:           m.roleService,
		TeamMembershipService: m.teamMembershipService,
		UserService:           m.userService,
	}

	authorizationService := portainer.NewAuthorizationService(authorizationServiceParameters)
	return authorizationService.UpdateUsersAuthorizations()
}
