package portainer

// AuthorizationService represents a service used to
// update authorizations associated to a user or team.
type AuthorizationService struct {
	endpointService       EndpointService
	endpointGroupService  EndpointGroupService
	roleService           RoleService
	teamMembershipService TeamMembershipService
	userService           UserService
}

// AuthorizationServiceParameters are the required parameters
// used to create a new AuthorizationService.
type AuthorizationServiceParameters struct {
	EndpointService       EndpointService
	EndpointGroupService  EndpointGroupService
	RoleService           RoleService
	TeamMembershipService TeamMembershipService
	UserService           UserService
}

// NewAuthorizationService returns a point to a new AuthorizationService instance.
func NewAuthorizationService(parameters *AuthorizationServiceParameters) *AuthorizationService {
	return &AuthorizationService{
		endpointService:       parameters.EndpointService,
		endpointGroupService:  parameters.EndpointGroupService,
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

// UpdateUserAuthorizationsFromPolicies will update users authorizations based on the specified access policies.
func (service *AuthorizationService) UpdateUserAuthorizationsFromPolicies(userPolicies *UserAccessPolicies, teamPolicies *TeamAccessPolicies) error {

	for userID, policy := range *userPolicies {
		if policy.RoleID == 0 {
			continue
		}

		err := service.UpdateUserAuthorizations(userID)
		if err != nil {
			return err
		}
	}

	for teamID, policy := range *teamPolicies {
		if policy.RoleID == 0 {
			continue
		}

		err := service.updateUserAuthorizationsInTeam(teamID)
		if err != nil {
			return err
		}
	}

	return nil
}

func (service *AuthorizationService) updateUserAuthorizationsInTeam(teamID TeamID) error {

	memberships, err := service.teamMembershipService.TeamMembershipsByTeamID(teamID)
	if err != nil {
		return err
	}

	for _, membership := range memberships {
		err := service.UpdateUserAuthorizations(membership.UserID)
		if err != nil {
			return err
		}
	}

	return nil
}

// UpdateUserAuthorizations will trigger an update of the authorizations for the specified user.
func (service *AuthorizationService) UpdateUserAuthorizations(userID UserID) error {
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

		endpointAuthorizations[endpoint.ID] = getAuthorizationsFromTeamEndpointGroupPolicies(userMemberships, &endpoint, roles, groupTeamAccessPolicies)
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
