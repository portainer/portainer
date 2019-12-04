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

// DefaultEndpointAuthorizationsForEndpointAdministratorRole returns the default endpoint authorizations
// associated to the endpoint administrator role.
func DefaultEndpointAuthorizationsForEndpointAdministratorRole() Authorizations {
	return map[Authorization]bool{
		OperationDockerContainerArchiveInfo:         true,
		OperationDockerContainerList:                true,
		OperationDockerContainerExport:              true,
		OperationDockerContainerChanges:             true,
		OperationDockerContainerInspect:             true,
		OperationDockerContainerTop:                 true,
		OperationDockerContainerLogs:                true,
		OperationDockerContainerStats:               true,
		OperationDockerContainerAttachWebsocket:     true,
		OperationDockerContainerArchive:             true,
		OperationDockerContainerCreate:              true,
		OperationDockerContainerPrune:               true,
		OperationDockerContainerKill:                true,
		OperationDockerContainerPause:               true,
		OperationDockerContainerUnpause:             true,
		OperationDockerContainerRestart:             true,
		OperationDockerContainerStart:               true,
		OperationDockerContainerStop:                true,
		OperationDockerContainerWait:                true,
		OperationDockerContainerResize:              true,
		OperationDockerContainerAttach:              true,
		OperationDockerContainerExec:                true,
		OperationDockerContainerRename:              true,
		OperationDockerContainerUpdate:              true,
		OperationDockerContainerPutContainerArchive: true,
		OperationDockerContainerDelete:              true,
		OperationDockerImageList:                    true,
		OperationDockerImageSearch:                  true,
		OperationDockerImageGetAll:                  true,
		OperationDockerImageGet:                     true,
		OperationDockerImageHistory:                 true,
		OperationDockerImageInspect:                 true,
		OperationDockerImageLoad:                    true,
		OperationDockerImageCreate:                  true,
		OperationDockerImagePrune:                   true,
		OperationDockerImagePush:                    true,
		OperationDockerImageTag:                     true,
		OperationDockerImageDelete:                  true,
		OperationDockerImageCommit:                  true,
		OperationDockerImageBuild:                   true,
		OperationDockerNetworkList:                  true,
		OperationDockerNetworkInspect:               true,
		OperationDockerNetworkCreate:                true,
		OperationDockerNetworkConnect:               true,
		OperationDockerNetworkDisconnect:            true,
		OperationDockerNetworkPrune:                 true,
		OperationDockerNetworkDelete:                true,
		OperationDockerVolumeList:                   true,
		OperationDockerVolumeInspect:                true,
		OperationDockerVolumeCreate:                 true,
		OperationDockerVolumePrune:                  true,
		OperationDockerVolumeDelete:                 true,
		OperationDockerExecInspect:                  true,
		OperationDockerExecStart:                    true,
		OperationDockerExecResize:                   true,
		OperationDockerSwarmInspect:                 true,
		OperationDockerSwarmUnlockKey:               true,
		OperationDockerSwarmInit:                    true,
		OperationDockerSwarmJoin:                    true,
		OperationDockerSwarmLeave:                   true,
		OperationDockerSwarmUpdate:                  true,
		OperationDockerSwarmUnlock:                  true,
		OperationDockerNodeList:                     true,
		OperationDockerNodeInspect:                  true,
		OperationDockerNodeUpdate:                   true,
		OperationDockerNodeDelete:                   true,
		OperationDockerServiceList:                  true,
		OperationDockerServiceInspect:               true,
		OperationDockerServiceLogs:                  true,
		OperationDockerServiceCreate:                true,
		OperationDockerServiceUpdate:                true,
		OperationDockerServiceDelete:                true,
		OperationDockerSecretList:                   true,
		OperationDockerSecretInspect:                true,
		OperationDockerSecretCreate:                 true,
		OperationDockerSecretUpdate:                 true,
		OperationDockerSecretDelete:                 true,
		OperationDockerConfigList:                   true,
		OperationDockerConfigInspect:                true,
		OperationDockerConfigCreate:                 true,
		OperationDockerConfigUpdate:                 true,
		OperationDockerConfigDelete:                 true,
		OperationDockerTaskList:                     true,
		OperationDockerTaskInspect:                  true,
		OperationDockerTaskLogs:                     true,
		OperationDockerPluginList:                   true,
		OperationDockerPluginPrivileges:             true,
		OperationDockerPluginInspect:                true,
		OperationDockerPluginPull:                   true,
		OperationDockerPluginCreate:                 true,
		OperationDockerPluginEnable:                 true,
		OperationDockerPluginDisable:                true,
		OperationDockerPluginPush:                   true,
		OperationDockerPluginUpgrade:                true,
		OperationDockerPluginSet:                    true,
		OperationDockerPluginDelete:                 true,
		OperationDockerSessionStart:                 true,
		OperationDockerDistributionInspect:          true,
		OperationDockerBuildPrune:                   true,
		OperationDockerBuildCancel:                  true,
		OperationDockerPing:                         true,
		OperationDockerInfo:                         true,
		OperationDockerVersion:                      true,
		OperationDockerEvents:                       true,
		OperationDockerSystem:                       true,
		OperationDockerUndefined:                    true,
		OperationDockerAgentPing:                    true,
		OperationDockerAgentList:                    true,
		OperationDockerAgentHostInfo:                true,
		OperationDockerAgentBrowseDelete:            true,
		OperationDockerAgentBrowseGet:               true,
		OperationDockerAgentBrowseList:              true,
		OperationDockerAgentBrowsePut:               true,
		OperationDockerAgentBrowseRename:            true,
		OperationDockerAgentUndefined:               true,
		OperationPortainerResourceControlCreate:     true,
		OperationPortainerResourceControlUpdate:     true,
		OperationPortainerStackList:                 true,
		OperationPortainerStackInspect:              true,
		OperationPortainerStackFile:                 true,
		OperationPortainerStackCreate:               true,
		OperationPortainerStackMigrate:              true,
		OperationPortainerStackUpdate:               true,
		OperationPortainerStackDelete:               true,
		OperationPortainerWebsocketExec:             true,
		OperationPortainerWebhookList:               true,
		OperationPortainerWebhookCreate:             true,
		OperationPortainerWebhookDelete:             true,
		OperationIntegrationStoridgeAdmin:           true,
		EndpointResourcesAccess:                     true,
	}
}

// DefaultEndpointAuthorizationsForHelpDeskRole returns the default endpoint authorizations
// associated to the helpdesk role.
func DefaultEndpointAuthorizationsForHelpDeskRole(volumeBrowsingAuthorizations bool) Authorizations {
	authorizations := map[Authorization]bool{
		OperationDockerContainerArchiveInfo: true,
		OperationDockerContainerList:        true,
		OperationDockerContainerChanges:     true,
		OperationDockerContainerInspect:     true,
		OperationDockerContainerTop:         true,
		OperationDockerContainerLogs:        true,
		OperationDockerContainerStats:       true,
		OperationDockerImageList:            true,
		OperationDockerImageSearch:          true,
		OperationDockerImageGetAll:          true,
		OperationDockerImageGet:             true,
		OperationDockerImageHistory:         true,
		OperationDockerImageInspect:         true,
		OperationDockerNetworkList:          true,
		OperationDockerNetworkInspect:       true,
		OperationDockerVolumeList:           true,
		OperationDockerVolumeInspect:        true,
		OperationDockerSwarmInspect:         true,
		OperationDockerNodeList:             true,
		OperationDockerNodeInspect:          true,
		OperationDockerServiceList:          true,
		OperationDockerServiceInspect:       true,
		OperationDockerServiceLogs:          true,
		OperationDockerSecretList:           true,
		OperationDockerSecretInspect:        true,
		OperationDockerConfigList:           true,
		OperationDockerConfigInspect:        true,
		OperationDockerTaskList:             true,
		OperationDockerTaskInspect:          true,
		OperationDockerTaskLogs:             true,
		OperationDockerPluginList:           true,
		OperationDockerDistributionInspect:  true,
		OperationDockerPing:                 true,
		OperationDockerInfo:                 true,
		OperationDockerVersion:              true,
		OperationDockerEvents:               true,
		OperationDockerSystem:               true,
		OperationDockerAgentPing:            true,
		OperationDockerAgentList:            true,
		OperationDockerAgentHostInfo:        true,
		OperationPortainerStackList:         true,
		OperationPortainerStackInspect:      true,
		OperationPortainerStackFile:         true,
		OperationPortainerWebhookList:       true,
		EndpointResourcesAccess:             true,
	}

	if volumeBrowsingAuthorizations {
		authorizations[OperationDockerAgentBrowseGet] = true
		authorizations[OperationDockerAgentBrowseList] = true
	}

	return authorizations
}

// DefaultEndpointAuthorizationsForStandardUserRole returns the default endpoint authorizations
// associated to the standard user role.
func DefaultEndpointAuthorizationsForStandardUserRole(volumeBrowsingAuthorizations bool) Authorizations {
	authorizations := map[Authorization]bool{
		OperationDockerContainerArchiveInfo:         true,
		OperationDockerContainerList:                true,
		OperationDockerContainerExport:              true,
		OperationDockerContainerChanges:             true,
		OperationDockerContainerInspect:             true,
		OperationDockerContainerTop:                 true,
		OperationDockerContainerLogs:                true,
		OperationDockerContainerStats:               true,
		OperationDockerContainerAttachWebsocket:     true,
		OperationDockerContainerArchive:             true,
		OperationDockerContainerCreate:              true,
		OperationDockerContainerKill:                true,
		OperationDockerContainerPause:               true,
		OperationDockerContainerUnpause:             true,
		OperationDockerContainerRestart:             true,
		OperationDockerContainerStart:               true,
		OperationDockerContainerStop:                true,
		OperationDockerContainerWait:                true,
		OperationDockerContainerResize:              true,
		OperationDockerContainerAttach:              true,
		OperationDockerContainerExec:                true,
		OperationDockerContainerRename:              true,
		OperationDockerContainerUpdate:              true,
		OperationDockerContainerPutContainerArchive: true,
		OperationDockerContainerDelete:              true,
		OperationDockerImageList:                    true,
		OperationDockerImageSearch:                  true,
		OperationDockerImageGetAll:                  true,
		OperationDockerImageGet:                     true,
		OperationDockerImageHistory:                 true,
		OperationDockerImageInspect:                 true,
		OperationDockerImageLoad:                    true,
		OperationDockerImageCreate:                  true,
		OperationDockerImagePush:                    true,
		OperationDockerImageTag:                     true,
		OperationDockerImageDelete:                  true,
		OperationDockerImageCommit:                  true,
		OperationDockerImageBuild:                   true,
		OperationDockerNetworkList:                  true,
		OperationDockerNetworkInspect:               true,
		OperationDockerNetworkCreate:                true,
		OperationDockerNetworkConnect:               true,
		OperationDockerNetworkDisconnect:            true,
		OperationDockerNetworkDelete:                true,
		OperationDockerVolumeList:                   true,
		OperationDockerVolumeInspect:                true,
		OperationDockerVolumeCreate:                 true,
		OperationDockerVolumeDelete:                 true,
		OperationDockerExecInspect:                  true,
		OperationDockerExecStart:                    true,
		OperationDockerExecResize:                   true,
		OperationDockerSwarmInspect:                 true,
		OperationDockerSwarmUnlockKey:               true,
		OperationDockerSwarmInit:                    true,
		OperationDockerSwarmJoin:                    true,
		OperationDockerSwarmLeave:                   true,
		OperationDockerSwarmUpdate:                  true,
		OperationDockerSwarmUnlock:                  true,
		OperationDockerNodeList:                     true,
		OperationDockerNodeInspect:                  true,
		OperationDockerNodeUpdate:                   true,
		OperationDockerNodeDelete:                   true,
		OperationDockerServiceList:                  true,
		OperationDockerServiceInspect:               true,
		OperationDockerServiceLogs:                  true,
		OperationDockerServiceCreate:                true,
		OperationDockerServiceUpdate:                true,
		OperationDockerServiceDelete:                true,
		OperationDockerSecretList:                   true,
		OperationDockerSecretInspect:                true,
		OperationDockerSecretCreate:                 true,
		OperationDockerSecretUpdate:                 true,
		OperationDockerSecretDelete:                 true,
		OperationDockerConfigList:                   true,
		OperationDockerConfigInspect:                true,
		OperationDockerConfigCreate:                 true,
		OperationDockerConfigUpdate:                 true,
		OperationDockerConfigDelete:                 true,
		OperationDockerTaskList:                     true,
		OperationDockerTaskInspect:                  true,
		OperationDockerTaskLogs:                     true,
		OperationDockerPluginList:                   true,
		OperationDockerPluginPrivileges:             true,
		OperationDockerPluginInspect:                true,
		OperationDockerPluginPull:                   true,
		OperationDockerPluginCreate:                 true,
		OperationDockerPluginEnable:                 true,
		OperationDockerPluginDisable:                true,
		OperationDockerPluginPush:                   true,
		OperationDockerPluginUpgrade:                true,
		OperationDockerPluginSet:                    true,
		OperationDockerPluginDelete:                 true,
		OperationDockerSessionStart:                 true,
		OperationDockerDistributionInspect:          true,
		OperationDockerBuildPrune:                   true,
		OperationDockerBuildCancel:                  true,
		OperationDockerPing:                         true,
		OperationDockerInfo:                         true,
		OperationDockerVersion:                      true,
		OperationDockerEvents:                       true,
		OperationDockerSystem:                       true,
		OperationDockerUndefined:                    true,
		OperationDockerAgentPing:                    true,
		OperationDockerAgentList:                    true,
		OperationDockerAgentHostInfo:                true,
		OperationDockerAgentUndefined:               true,
		OperationPortainerResourceControlUpdate:     true,
		OperationPortainerStackList:                 true,
		OperationPortainerStackInspect:              true,
		OperationPortainerStackFile:                 true,
		OperationPortainerStackCreate:               true,
		OperationPortainerStackMigrate:              true,
		OperationPortainerStackUpdate:               true,
		OperationPortainerStackDelete:               true,
		OperationPortainerWebsocketExec:             true,
		OperationPortainerWebhookList:               true,
		OperationPortainerWebhookCreate:             true,
	}

	if volumeBrowsingAuthorizations {
		authorizations[OperationDockerAgentBrowseGet] = true
		authorizations[OperationDockerAgentBrowseList] = true
		authorizations[OperationDockerAgentBrowseDelete] = true
		authorizations[OperationDockerAgentBrowsePut] = true
		authorizations[OperationDockerAgentBrowseRename] = true
	}

	return authorizations
}

// DefaultEndpointAuthorizationsForReadOnlyUserRole returns the default endpoint authorizations
// associated to the readonly user role.
func DefaultEndpointAuthorizationsForReadOnlyUserRole(volumeBrowsingAuthorizations bool) Authorizations {
	authorizations := map[Authorization]bool{
		OperationDockerContainerArchiveInfo: true,
		OperationDockerContainerList:        true,
		OperationDockerContainerChanges:     true,
		OperationDockerContainerInspect:     true,
		OperationDockerContainerTop:         true,
		OperationDockerContainerLogs:        true,
		OperationDockerContainerStats:       true,
		OperationDockerImageList:            true,
		OperationDockerImageSearch:          true,
		OperationDockerImageGetAll:          true,
		OperationDockerImageGet:             true,
		OperationDockerImageHistory:         true,
		OperationDockerImageInspect:         true,
		OperationDockerNetworkList:          true,
		OperationDockerNetworkInspect:       true,
		OperationDockerVolumeList:           true,
		OperationDockerVolumeInspect:        true,
		OperationDockerSwarmInspect:         true,
		OperationDockerNodeList:             true,
		OperationDockerNodeInspect:          true,
		OperationDockerServiceList:          true,
		OperationDockerServiceInspect:       true,
		OperationDockerServiceLogs:          true,
		OperationDockerSecretList:           true,
		OperationDockerSecretInspect:        true,
		OperationDockerConfigList:           true,
		OperationDockerConfigInspect:        true,
		OperationDockerTaskList:             true,
		OperationDockerTaskInspect:          true,
		OperationDockerTaskLogs:             true,
		OperationDockerPluginList:           true,
		OperationDockerDistributionInspect:  true,
		OperationDockerPing:                 true,
		OperationDockerInfo:                 true,
		OperationDockerVersion:              true,
		OperationDockerEvents:               true,
		OperationDockerSystem:               true,
		OperationDockerAgentPing:            true,
		OperationDockerAgentList:            true,
		OperationDockerAgentHostInfo:        true,
		OperationPortainerStackList:         true,
		OperationPortainerStackInspect:      true,
		OperationPortainerStackFile:         true,
		OperationPortainerWebhookList:       true,
	}

	if volumeBrowsingAuthorizations {
		authorizations[OperationDockerAgentBrowseGet] = true
		authorizations[OperationDockerAgentBrowseList] = true
	}

	return authorizations
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

	return service.UpdateUsersAuthorizations()
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
	var associatedRoles []Role

	for _, id := range roleIdentifiers {
		for _, role := range roles {
			if role.ID == id {
				associatedRoles = append(associatedRoles, role)
				break
			}
		}
	}

	var authorizations Authorizations
	highestPriority := 0
	for _, role := range associatedRoles {
		if role.Priority > highestPriority {
			highestPriority = role.Priority
			authorizations = role.Authorizations
		}
	}

	return authorizations
}
