package portainer

// AuthorizationService represents a service used to
// update authorizations associated to a user or team.
type AuthorizationService struct {
	endpointService       EndpointService
	endpointGroupService  EndpointGroupService
	registryService       RegistryService
	roleService           RoleService
	teamMembershipService TeamMembershipService
	userService           UserService
}

// AuthorizationServiceParameters are the required parameters
// used to create a new AuthorizationService.
type AuthorizationServiceParameters struct {
	EndpointService       EndpointService
	EndpointGroupService  EndpointGroupService
	RegistryService       RegistryService
	RoleService           RoleService
	TeamMembershipService TeamMembershipService
	UserService           UserService
}

// NewAuthorizationService returns a point to a new AuthorizationService instance.
func NewAuthorizationService(parameters *AuthorizationServiceParameters) *AuthorizationService {
	return &AuthorizationService{
		endpointService:       parameters.EndpointService,
		endpointGroupService:  parameters.EndpointGroupService,
		registryService:       parameters.RegistryService,
		roleService:           parameters.RoleService,
		teamMembershipService: parameters.TeamMembershipService,
		userService:           parameters.UserService,
	}
}

// DefaultPortainerAuthorizations returns the default Portainer authorizations used by non-admin users.
func DefaultPortainerAuthorizations() Authorizations {
	return map[Authorization]bool{
		OperationPortainerDockerHubInspect:        true,
		OperationPortainerEndpointGroupList:       true,
		OperationPortainerEndpointList:            true,
		OperationPortainerEndpointInspect:         true,
		OperationPortainerEndpointExtensionAdd:    true,
		OperationPortainerEndpointExtensionRemove: true,
		OperationPortainerExtensionList:           true,
		OperationPortainerMOTD:                    true,
		OperationPortainerRegistryList:            true,
		OperationPortainerRegistryInspect:         true,
		OperationPortainerTeamList:                true,
		OperationPortainerTemplateList:            true,
		OperationPortainerTemplateInspect:         true,
		OperationPortainerUserList:                true,
		OperationPortainerUserInspect:             true,
		OperationPortainerUserMemberships:         true,
	}
}

// UpdateVolumeBrowsingAuthorizations will update all the volume browsing authorizations for each role (except endpoint administrator)
// based on the specified removeAuthorizations parameter. If removeAuthorizations is set to true, all
// the authorizations will be dropped for the each role. If removeAuthorizations is set to false, the authorizations
// will be reset based for each role.
func (service AuthorizationService) UpdateVolumeBrowsingAuthorizations(remove bool) error {
	roles, err := service.roleService.Roles()
	if err != nil {
		return err
	}

	for _, role := range roles {
		// all roles except endpoint administrator
		if role.ID != RoleID(1) {
			updateRoleVolumeBrowsingAuthorizations(&role, remove)

			err := service.roleService.UpdateRole(role.ID, &role)
			if err != nil {
				return err
			}
		}
	}

	return nil
}

func updateRoleVolumeBrowsingAuthorizations(role *Role, removeAuthorizations bool) {
	if !removeAuthorizations {
		delete(role.Authorizations, OperationDockerAgentBrowseDelete)
		delete(role.Authorizations, OperationDockerAgentBrowseGet)
		delete(role.Authorizations, OperationDockerAgentBrowseList)
		delete(role.Authorizations, OperationDockerAgentBrowsePut)
		delete(role.Authorizations, OperationDockerAgentBrowseRename)
		return
	}

	role.Authorizations[OperationDockerAgentBrowseGet] = true
	role.Authorizations[OperationDockerAgentBrowseList] = true

	// Standard-user
	if role.ID == RoleID(3) {
		role.Authorizations[OperationDockerAgentBrowseDelete] = true
		role.Authorizations[OperationDockerAgentBrowsePut] = true
		role.Authorizations[OperationDockerAgentBrowseRename] = true
	}
}

// RemoveTeamAccessPolicies will remove all existing access policies associated to the specified team
func (service *AuthorizationService) RemoveTeamAccessPolicies(teamID TeamID) error {
	endpoints, err := service.endpointService.Endpoints()
	if err != nil {
		return err
	}

	for _, endpoint := range endpoints {
		for policyTeamID := range endpoint.TeamAccessPolicies {
			if policyTeamID == teamID {
				delete(endpoint.TeamAccessPolicies, policyTeamID)

				err := service.endpointService.UpdateEndpoint(endpoint.ID, &endpoint)
				if err != nil {
					return err
				}

				break
			}
		}
	}

	endpointGroups, err := service.endpointGroupService.EndpointGroups()
	if err != nil {
		return err
	}

	for _, endpointGroup := range endpointGroups {
		for policyTeamID := range endpointGroup.TeamAccessPolicies {
			if policyTeamID == teamID {
				delete(endpointGroup.TeamAccessPolicies, policyTeamID)

				err := service.endpointGroupService.UpdateEndpointGroup(endpointGroup.ID, &endpointGroup)
				if err != nil {
					return err
				}

				break
			}
		}
	}

	registries, err := service.registryService.Registries()
	if err != nil {
		return err
	}

	for _, registry := range registries {
		for policyTeamID := range registry.TeamAccessPolicies {
			if policyTeamID == teamID {
				delete(registry.TeamAccessPolicies, policyTeamID)

				err := service.registryService.UpdateRegistry(registry.ID, &registry)
				if err != nil {
					return err
				}

				break
			}
		}
	}

	return nil
}

// RemoveUserAccessPolicies will remove all existing access policies associated to the specified user
func (service *AuthorizationService) RemoveUserAccessPolicies(userID UserID) error {
	endpoints, err := service.endpointService.Endpoints()
	if err != nil {
		return err
	}

	for _, endpoint := range endpoints {
		for policyUserID := range endpoint.UserAccessPolicies {
			if policyUserID == userID {
				delete(endpoint.UserAccessPolicies, policyUserID)

				err := service.endpointService.UpdateEndpoint(endpoint.ID, &endpoint)
				if err != nil {
					return err
				}

				break
			}
		}
	}

	endpointGroups, err := service.endpointGroupService.EndpointGroups()
	if err != nil {
		return err
	}

	for _, endpointGroup := range endpointGroups {
		for policyUserID := range endpointGroup.UserAccessPolicies {
			if policyUserID == userID {
				delete(endpointGroup.UserAccessPolicies, policyUserID)

				err := service.endpointGroupService.UpdateEndpointGroup(endpointGroup.ID, &endpointGroup)
				if err != nil {
					return err
				}

				break
			}
		}
	}

	registries, err := service.registryService.Registries()
	if err != nil {
		return err
	}

	for _, registry := range registries {
		for policyUserID := range registry.UserAccessPolicies {
			if policyUserID == userID {
				delete(registry.UserAccessPolicies, policyUserID)

				err := service.registryService.UpdateRegistry(registry.ID, &registry)
				if err != nil {
					return err
				}

				break
			}
		}
	}

	return nil
}

// UpdateUsersAuthorizations will trigger an update of the authorizations for all the users.
func (service *AuthorizationService) UpdateUsersAuthorizations() error {
	users, err := service.userService.Users()
	if err != nil {
		return err
	}

	for _, user := range users {
		err := service.updateUserAuthorizations(user.ID)
		if err != nil {
			return err
		}
	}

	return nil
}

func (service *AuthorizationService) updateUserAuthorizations(userID UserID) error {
	user, err := service.userService.User(userID)
	if err != nil {
		return err
	}

	endpointAuthorizations, err := service.getAuthorizations(user)
	if err != nil {
		return err
	}

	user.EndpointAuthorizations = endpointAuthorizations

	return service.userService.UpdateUser(userID, user)
}

func (service *AuthorizationService) getAuthorizations(user *User) (EndpointAuthorizations, error) {
	endpointAuthorizations := EndpointAuthorizations{}
	if user.Role == AdministratorRole {
		return endpointAuthorizations, nil
	}

	userMemberships, err := service.teamMembershipService.TeamMembershipsByUserID(user.ID)
	if err != nil {
		return endpointAuthorizations, err
	}

	endpoints, err := service.endpointService.Endpoints()
	if err != nil {
		return endpointAuthorizations, err
	}

	endpointGroups, err := service.endpointGroupService.EndpointGroups()
	if err != nil {
		return endpointAuthorizations, err
	}

	roles, err := service.roleService.Roles()
	if err != nil {
		return endpointAuthorizations, err
	}

	endpointAuthorizations = getUserEndpointAuthorizations(user, endpoints, endpointGroups, roles, userMemberships)

	return endpointAuthorizations, nil
}

func getUserEndpointAuthorizations(user *User, endpoints []Endpoint, endpointGroups []EndpointGroup, roles []Role, userMemberships []TeamMembership) EndpointAuthorizations {
	endpointAuthorizations := make(EndpointAuthorizations)

	groupUserAccessPolicies := map[EndpointGroupID]UserAccessPolicies{}
	groupTeamAccessPolicies := map[EndpointGroupID]TeamAccessPolicies{}
	for _, endpointGroup := range endpointGroups {
		groupUserAccessPolicies[endpointGroup.ID] = endpointGroup.UserAccessPolicies
		groupTeamAccessPolicies[endpointGroup.ID] = endpointGroup.TeamAccessPolicies
	}

	for _, endpoint := range endpoints {
		authorizations := getAuthorizationsFromUserEndpointPolicy(user, &endpoint, roles)
		if len(authorizations) > 0 {
			endpointAuthorizations[endpoint.ID] = authorizations
			continue
		}

		authorizations = getAuthorizationsFromUserEndpointGroupPolicy(user, &endpoint, roles, groupUserAccessPolicies)
		if len(authorizations) > 0 {
			endpointAuthorizations[endpoint.ID] = authorizations
			continue
		}

		authorizations = getAuthorizationsFromTeamEndpointPolicies(userMemberships, &endpoint, roles)
		if len(authorizations) > 0 {
			endpointAuthorizations[endpoint.ID] = authorizations
			continue
		}

		authorizations = getAuthorizationsFromTeamEndpointGroupPolicies(userMemberships, &endpoint, roles, groupTeamAccessPolicies)
		if len(authorizations) > 0 {
			endpointAuthorizations[endpoint.ID] = authorizations
		}
	}

	return endpointAuthorizations
}

func getAuthorizationsFromUserEndpointPolicy(user *User, endpoint *Endpoint, roles []Role) Authorizations {
	policyRoles := make([]RoleID, 0)

	policy, ok := endpoint.UserAccessPolicies[user.ID]
	if ok {
		policyRoles = append(policyRoles, policy.RoleID)
	}

	return getAuthorizationsFromRoles(policyRoles, roles)
}

func getAuthorizationsFromUserEndpointGroupPolicy(user *User, endpoint *Endpoint, roles []Role, groupAccessPolicies map[EndpointGroupID]UserAccessPolicies) Authorizations {
	policyRoles := make([]RoleID, 0)

	policy, ok := groupAccessPolicies[endpoint.GroupID][user.ID]
	if ok {
		policyRoles = append(policyRoles, policy.RoleID)
	}

	return getAuthorizationsFromRoles(policyRoles, roles)
}

func getAuthorizationsFromTeamEndpointPolicies(memberships []TeamMembership, endpoint *Endpoint, roles []Role) Authorizations {
	policyRoles := make([]RoleID, 0)

	for _, membership := range memberships {
		policy, ok := endpoint.TeamAccessPolicies[membership.TeamID]
		if ok {
			policyRoles = append(policyRoles, policy.RoleID)
		}
	}

	return getAuthorizationsFromRoles(policyRoles, roles)
}

func getAuthorizationsFromTeamEndpointGroupPolicies(memberships []TeamMembership, endpoint *Endpoint, roles []Role, groupAccessPolicies map[EndpointGroupID]TeamAccessPolicies) Authorizations {
	policyRoles := make([]RoleID, 0)

	for _, membership := range memberships {
		policy, ok := groupAccessPolicies[endpoint.GroupID][membership.TeamID]
		if ok {
			policyRoles = append(policyRoles, policy.RoleID)
		}
	}

	return getAuthorizationsFromRoles(policyRoles, roles)
}

func getAuthorizationsFromRoles(roleIdentifiers []RoleID, roles []Role) Authorizations {
	var roleAuthorizations []Authorizations
	for _, id := range roleIdentifiers {
		for _, role := range roles {
			if role.ID == id {
				roleAuthorizations = append(roleAuthorizations, role.Authorizations)
				break
			}
		}
	}

	processedAuthorizations := make(Authorizations)
	if len(roleAuthorizations) > 0 {
		processedAuthorizations = roleAuthorizations[0]
		for idx, authorizations := range roleAuthorizations {
			if idx == 0 {
				continue
			}
			processedAuthorizations = mergeAuthorizations(processedAuthorizations, authorizations)
		}
	}

	return processedAuthorizations
}

func mergeAuthorizations(a, b Authorizations) Authorizations {
	c := make(map[Authorization]bool)

	for k := range b {
		if _, ok := a[k]; ok {
			c[k] = true
		}
	}
	return c
}
