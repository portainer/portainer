package bolt

import portainer "github.com/portainer/portainer/api"

// Init creates the default data set.
func (store *Store) Init() error {
	groups, err := store.EndpointGroupService.EndpointGroups()
	if err != nil {
		return err
	}

	if len(groups) == 0 {
		unassignedGroup := &portainer.EndpointGroup{
			Name:               "Unassigned",
			Description:        "Unassigned endpoints",
			Labels:             []portainer.Pair{},
			UserAccessPolicies: portainer.UserAccessPolicies{},
			TeamAccessPolicies: portainer.TeamAccessPolicies{},
			Tags:               []portainer.TagID{},
		}

		err = store.EndpointGroupService.CreateEndpointGroup(unassignedGroup)
		if err != nil {
			return err
		}
	}

	roles, err := store.RoleService.Roles()
	if err != nil {
		return err
	}

	if len(roles) == 0 {
		environmentAdministratorRole := &portainer.Role{
			Name:           "Endpoint administrator",
			Description:    "Full control of all resources in an endpoint",
			Priority:       1,
			Authorizations: portainer.DefaultEndpointAuthorizationsForEndpointAdministratorRole(),
		}

		err = store.RoleService.CreateRole(environmentAdministratorRole)
		if err != nil {
			return err
		}

		environmentReadOnlyUserRole := &portainer.Role{
			Name:           "Helpdesk",
			Description:    "Read-only access of all resources in an endpoint",
			Priority:       2,
			Authorizations: portainer.DefaultEndpointAuthorizationsForHelpDeskRole(false),
		}

		err = store.RoleService.CreateRole(environmentReadOnlyUserRole)
		if err != nil {
			return err
		}

		standardUserRole := &portainer.Role{
			Name:           "Standard user",
			Description:    "Full control of assigned resources in an endpoint",
			Priority:       3,
			Authorizations: portainer.DefaultEndpointAuthorizationsForStandardUserRole(false),
		}

		err = store.RoleService.CreateRole(standardUserRole)
		if err != nil {
			return err
		}

		readOnlyUserRole := &portainer.Role{
			Name:           "Read-only user",
			Description:    "Read-only access of assigned resources in an endpoint",
			Priority:       4,
			Authorizations: portainer.DefaultEndpointAuthorizationsForReadOnlyUserRole(false),
		}

		err = store.RoleService.CreateRole(readOnlyUserRole)
		if err != nil {
			return err
		}
	}

	return nil
}
