package authorization

import (
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	"github.com/portainer/portainer/api/kubernetes/cli"
)

// Service represents a service used to
// update authorizations associated to a user or team.
type Service struct {
	dataStore        dataservices.DataStore
	K8sClientFactory *cli.ClientFactory
}

// NewService returns a point to a new Service instance.
func NewService(dataStore dataservices.DataStore) *Service {
	return &Service{
		dataStore: dataStore,
	}
}

// DefaultEndpointAuthorizationsForEndpointAdministratorRole returns the default environment(endpoint) authorizations
// associated to the environment(endpoint) administrator role.
func DefaultEndpointAuthorizationsForEndpointAdministratorRole() portainer.Authorizations {
	return map[portainer.Authorization]bool{
		portainer.OperationDockerContainerArchiveInfo:         true,
		portainer.OperationDockerContainerList:                true,
		portainer.OperationDockerContainerExport:              true,
		portainer.OperationDockerContainerChanges:             true,
		portainer.OperationDockerContainerInspect:             true,
		portainer.OperationDockerContainerTop:                 true,
		portainer.OperationDockerContainerLogs:                true,
		portainer.OperationDockerContainerStats:               true,
		portainer.OperationDockerContainerAttachWebsocket:     true,
		portainer.OperationDockerContainerArchive:             true,
		portainer.OperationDockerContainerCreate:              true,
		portainer.OperationDockerContainerPrune:               true,
		portainer.OperationDockerContainerKill:                true,
		portainer.OperationDockerContainerPause:               true,
		portainer.OperationDockerContainerUnpause:             true,
		portainer.OperationDockerContainerRestart:             true,
		portainer.OperationDockerContainerStart:               true,
		portainer.OperationDockerContainerStop:                true,
		portainer.OperationDockerContainerWait:                true,
		portainer.OperationDockerContainerResize:              true,
		portainer.OperationDockerContainerAttach:              true,
		portainer.OperationDockerContainerExec:                true,
		portainer.OperationDockerContainerRename:              true,
		portainer.OperationDockerContainerUpdate:              true,
		portainer.OperationDockerContainerPutContainerArchive: true,
		portainer.OperationDockerContainerDelete:              true,
		portainer.OperationDockerImageList:                    true,
		portainer.OperationDockerImageSearch:                  true,
		portainer.OperationDockerImageGetAll:                  true,
		portainer.OperationDockerImageGet:                     true,
		portainer.OperationDockerImageHistory:                 true,
		portainer.OperationDockerImageInspect:                 true,
		portainer.OperationDockerImageLoad:                    true,
		portainer.OperationDockerImageCreate:                  true,
		portainer.OperationDockerImagePrune:                   true,
		portainer.OperationDockerImagePush:                    true,
		portainer.OperationDockerImageTag:                     true,
		portainer.OperationDockerImageDelete:                  true,
		portainer.OperationDockerImageCommit:                  true,
		portainer.OperationDockerImageBuild:                   true,
		portainer.OperationDockerNetworkList:                  true,
		portainer.OperationDockerNetworkInspect:               true,
		portainer.OperationDockerNetworkCreate:                true,
		portainer.OperationDockerNetworkConnect:               true,
		portainer.OperationDockerNetworkDisconnect:            true,
		portainer.OperationDockerNetworkPrune:                 true,
		portainer.OperationDockerNetworkDelete:                true,
		portainer.OperationDockerVolumeList:                   true,
		portainer.OperationDockerVolumeInspect:                true,
		portainer.OperationDockerVolumeCreate:                 true,
		portainer.OperationDockerVolumePrune:                  true,
		portainer.OperationDockerVolumeDelete:                 true,
		portainer.OperationDockerExecInspect:                  true,
		portainer.OperationDockerExecStart:                    true,
		portainer.OperationDockerExecResize:                   true,
		portainer.OperationDockerSwarmInspect:                 true,
		portainer.OperationDockerSwarmUnlockKey:               true,
		portainer.OperationDockerSwarmInit:                    true,
		portainer.OperationDockerSwarmJoin:                    true,
		portainer.OperationDockerSwarmLeave:                   true,
		portainer.OperationDockerSwarmUpdate:                  true,
		portainer.OperationDockerSwarmUnlock:                  true,
		portainer.OperationDockerNodeList:                     true,
		portainer.OperationDockerNodeInspect:                  true,
		portainer.OperationDockerNodeUpdate:                   true,
		portainer.OperationDockerNodeDelete:                   true,
		portainer.OperationDockerServiceList:                  true,
		portainer.OperationDockerServiceInspect:               true,
		portainer.OperationDockerServiceLogs:                  true,
		portainer.OperationDockerServiceCreate:                true,
		portainer.OperationDockerServiceUpdate:                true,
		portainer.OperationDockerServiceDelete:                true,
		portainer.OperationDockerSecretList:                   true,
		portainer.OperationDockerSecretInspect:                true,
		portainer.OperationDockerSecretCreate:                 true,
		portainer.OperationDockerSecretUpdate:                 true,
		portainer.OperationDockerSecretDelete:                 true,
		portainer.OperationDockerConfigList:                   true,
		portainer.OperationDockerConfigInspect:                true,
		portainer.OperationDockerConfigCreate:                 true,
		portainer.OperationDockerConfigUpdate:                 true,
		portainer.OperationDockerConfigDelete:                 true,
		portainer.OperationDockerTaskList:                     true,
		portainer.OperationDockerTaskInspect:                  true,
		portainer.OperationDockerTaskLogs:                     true,
		portainer.OperationDockerPluginList:                   true,
		portainer.OperationDockerPluginPrivileges:             true,
		portainer.OperationDockerPluginInspect:                true,
		portainer.OperationDockerPluginPull:                   true,
		portainer.OperationDockerPluginCreate:                 true,
		portainer.OperationDockerPluginEnable:                 true,
		portainer.OperationDockerPluginDisable:                true,
		portainer.OperationDockerPluginPush:                   true,
		portainer.OperationDockerPluginUpgrade:                true,
		portainer.OperationDockerPluginSet:                    true,
		portainer.OperationDockerPluginDelete:                 true,
		portainer.OperationDockerSessionStart:                 true,
		portainer.OperationDockerDistributionInspect:          true,
		portainer.OperationDockerBuildPrune:                   true,
		portainer.OperationDockerBuildCancel:                  true,
		portainer.OperationDockerPing:                         true,
		portainer.OperationDockerInfo:                         true,
		portainer.OperationDockerVersion:                      true,
		portainer.OperationDockerEvents:                       true,
		portainer.OperationDockerSystem:                       true,
		portainer.OperationDockerUndefined:                    true,
		portainer.OperationDockerAgentPing:                    true,
		portainer.OperationDockerAgentList:                    true,
		portainer.OperationDockerAgentHostInfo:                true,
		portainer.OperationDockerAgentBrowseDelete:            true,
		portainer.OperationDockerAgentBrowseGet:               true,
		portainer.OperationDockerAgentBrowseList:              true,
		portainer.OperationDockerAgentBrowsePut:               true,
		portainer.OperationDockerAgentBrowseRename:            true,
		portainer.OperationDockerAgentUndefined:               true,
		portainer.OperationPortainerResourceControlCreate:     true,
		portainer.OperationPortainerResourceControlUpdate:     true,
		portainer.OperationPortainerRegistryUpdateAccess:      true,
		portainer.OperationPortainerStackList:                 true,
		portainer.OperationPortainerStackInspect:              true,
		portainer.OperationPortainerStackFile:                 true,
		portainer.OperationPortainerStackCreate:               true,
		portainer.OperationPortainerStackMigrate:              true,
		portainer.OperationPortainerStackUpdate:               true,
		portainer.OperationPortainerStackDelete:               true,
		portainer.OperationPortainerWebsocketExec:             true,
		portainer.OperationPortainerWebhookList:               true,
		portainer.OperationPortainerWebhookCreate:             true,
		portainer.OperationPortainerWebhookDelete:             true,
		portainer.EndpointResourcesAccess:                     true,
	}
}

// DefaultEndpointAuthorizationsForHelpDeskRole returns the default environment(endpoint) authorizations
// associated to the helpdesk role.
func DefaultEndpointAuthorizationsForHelpDeskRole(volumeBrowsingAuthorizations bool) portainer.Authorizations {
	authorizations := map[portainer.Authorization]bool{
		portainer.OperationDockerContainerArchiveInfo: true,
		portainer.OperationDockerContainerList:        true,
		portainer.OperationDockerContainerChanges:     true,
		portainer.OperationDockerContainerInspect:     true,
		portainer.OperationDockerContainerTop:         true,
		portainer.OperationDockerContainerLogs:        true,
		portainer.OperationDockerContainerStats:       true,
		portainer.OperationDockerImageList:            true,
		portainer.OperationDockerImageSearch:          true,
		portainer.OperationDockerImageGetAll:          true,
		portainer.OperationDockerImageGet:             true,
		portainer.OperationDockerImageHistory:         true,
		portainer.OperationDockerImageInspect:         true,
		portainer.OperationDockerNetworkList:          true,
		portainer.OperationDockerNetworkInspect:       true,
		portainer.OperationDockerVolumeList:           true,
		portainer.OperationDockerVolumeInspect:        true,
		portainer.OperationDockerSwarmInspect:         true,
		portainer.OperationDockerNodeList:             true,
		portainer.OperationDockerNodeInspect:          true,
		portainer.OperationDockerServiceList:          true,
		portainer.OperationDockerServiceInspect:       true,
		portainer.OperationDockerServiceLogs:          true,
		portainer.OperationDockerSecretList:           true,
		portainer.OperationDockerSecretInspect:        true,
		portainer.OperationDockerConfigList:           true,
		portainer.OperationDockerConfigInspect:        true,
		portainer.OperationDockerTaskList:             true,
		portainer.OperationDockerTaskInspect:          true,
		portainer.OperationDockerTaskLogs:             true,
		portainer.OperationDockerPluginList:           true,
		portainer.OperationDockerDistributionInspect:  true,
		portainer.OperationDockerPing:                 true,
		portainer.OperationDockerInfo:                 true,
		portainer.OperationDockerVersion:              true,
		portainer.OperationDockerEvents:               true,
		portainer.OperationDockerSystem:               true,
		portainer.OperationDockerAgentPing:            true,
		portainer.OperationDockerAgentList:            true,
		portainer.OperationDockerAgentHostInfo:        true,
		portainer.OperationPortainerStackList:         true,
		portainer.OperationPortainerStackInspect:      true,
		portainer.OperationPortainerStackFile:         true,
		portainer.OperationPortainerWebhookList:       true,
		portainer.EndpointResourcesAccess:             true,
	}

	if volumeBrowsingAuthorizations {
		authorizations[portainer.OperationDockerAgentBrowseGet] = true
		authorizations[portainer.OperationDockerAgentBrowseList] = true
	}

	return authorizations
}

// DefaultEndpointAuthorizationsForStandardUserRole returns the default environment(endpoint) authorizations
// associated to the standard user role.
func DefaultEndpointAuthorizationsForStandardUserRole(volumeBrowsingAuthorizations bool) portainer.Authorizations {
	authorizations := map[portainer.Authorization]bool{
		portainer.OperationDockerContainerArchiveInfo:         true,
		portainer.OperationDockerContainerList:                true,
		portainer.OperationDockerContainerExport:              true,
		portainer.OperationDockerContainerChanges:             true,
		portainer.OperationDockerContainerInspect:             true,
		portainer.OperationDockerContainerTop:                 true,
		portainer.OperationDockerContainerLogs:                true,
		portainer.OperationDockerContainerStats:               true,
		portainer.OperationDockerContainerAttachWebsocket:     true,
		portainer.OperationDockerContainerArchive:             true,
		portainer.OperationDockerContainerCreate:              true,
		portainer.OperationDockerContainerKill:                true,
		portainer.OperationDockerContainerPause:               true,
		portainer.OperationDockerContainerUnpause:             true,
		portainer.OperationDockerContainerRestart:             true,
		portainer.OperationDockerContainerStart:               true,
		portainer.OperationDockerContainerStop:                true,
		portainer.OperationDockerContainerWait:                true,
		portainer.OperationDockerContainerResize:              true,
		portainer.OperationDockerContainerAttach:              true,
		portainer.OperationDockerContainerExec:                true,
		portainer.OperationDockerContainerRename:              true,
		portainer.OperationDockerContainerUpdate:              true,
		portainer.OperationDockerContainerPutContainerArchive: true,
		portainer.OperationDockerContainerDelete:              true,
		portainer.OperationDockerImageList:                    true,
		portainer.OperationDockerImageSearch:                  true,
		portainer.OperationDockerImageGetAll:                  true,
		portainer.OperationDockerImageGet:                     true,
		portainer.OperationDockerImageHistory:                 true,
		portainer.OperationDockerImageInspect:                 true,
		portainer.OperationDockerImageLoad:                    true,
		portainer.OperationDockerImageCreate:                  true,
		portainer.OperationDockerImagePush:                    true,
		portainer.OperationDockerImageTag:                     true,
		portainer.OperationDockerImageDelete:                  true,
		portainer.OperationDockerImageCommit:                  true,
		portainer.OperationDockerImageBuild:                   true,
		portainer.OperationDockerNetworkList:                  true,
		portainer.OperationDockerNetworkInspect:               true,
		portainer.OperationDockerNetworkCreate:                true,
		portainer.OperationDockerNetworkConnect:               true,
		portainer.OperationDockerNetworkDisconnect:            true,
		portainer.OperationDockerNetworkDelete:                true,
		portainer.OperationDockerVolumeList:                   true,
		portainer.OperationDockerVolumeInspect:                true,
		portainer.OperationDockerVolumeCreate:                 true,
		portainer.OperationDockerVolumeDelete:                 true,
		portainer.OperationDockerExecInspect:                  true,
		portainer.OperationDockerExecStart:                    true,
		portainer.OperationDockerExecResize:                   true,
		portainer.OperationDockerSwarmInspect:                 true,
		portainer.OperationDockerSwarmUnlockKey:               true,
		portainer.OperationDockerSwarmInit:                    true,
		portainer.OperationDockerSwarmJoin:                    true,
		portainer.OperationDockerSwarmLeave:                   true,
		portainer.OperationDockerSwarmUpdate:                  true,
		portainer.OperationDockerSwarmUnlock:                  true,
		portainer.OperationDockerNodeList:                     true,
		portainer.OperationDockerNodeInspect:                  true,
		portainer.OperationDockerNodeUpdate:                   true,
		portainer.OperationDockerNodeDelete:                   true,
		portainer.OperationDockerServiceList:                  true,
		portainer.OperationDockerServiceInspect:               true,
		portainer.OperationDockerServiceLogs:                  true,
		portainer.OperationDockerServiceCreate:                true,
		portainer.OperationDockerServiceUpdate:                true,
		portainer.OperationDockerServiceDelete:                true,
		portainer.OperationDockerSecretList:                   true,
		portainer.OperationDockerSecretInspect:                true,
		portainer.OperationDockerSecretCreate:                 true,
		portainer.OperationDockerSecretUpdate:                 true,
		portainer.OperationDockerSecretDelete:                 true,
		portainer.OperationDockerConfigList:                   true,
		portainer.OperationDockerConfigInspect:                true,
		portainer.OperationDockerConfigCreate:                 true,
		portainer.OperationDockerConfigUpdate:                 true,
		portainer.OperationDockerConfigDelete:                 true,
		portainer.OperationDockerTaskList:                     true,
		portainer.OperationDockerTaskInspect:                  true,
		portainer.OperationDockerTaskLogs:                     true,
		portainer.OperationDockerPluginList:                   true,
		portainer.OperationDockerPluginPrivileges:             true,
		portainer.OperationDockerPluginInspect:                true,
		portainer.OperationDockerPluginPull:                   true,
		portainer.OperationDockerPluginCreate:                 true,
		portainer.OperationDockerPluginEnable:                 true,
		portainer.OperationDockerPluginDisable:                true,
		portainer.OperationDockerPluginPush:                   true,
		portainer.OperationDockerPluginUpgrade:                true,
		portainer.OperationDockerPluginSet:                    true,
		portainer.OperationDockerPluginDelete:                 true,
		portainer.OperationDockerSessionStart:                 true,
		portainer.OperationDockerDistributionInspect:          true,
		portainer.OperationDockerBuildPrune:                   true,
		portainer.OperationDockerBuildCancel:                  true,
		portainer.OperationDockerPing:                         true,
		portainer.OperationDockerInfo:                         true,
		portainer.OperationDockerVersion:                      true,
		portainer.OperationDockerEvents:                       true,
		portainer.OperationDockerSystem:                       true,
		portainer.OperationDockerUndefined:                    true,
		portainer.OperationDockerAgentPing:                    true,
		portainer.OperationDockerAgentList:                    true,
		portainer.OperationDockerAgentHostInfo:                true,
		portainer.OperationDockerAgentUndefined:               true,
		portainer.OperationPortainerResourceControlUpdate:     true,
		portainer.OperationPortainerStackList:                 true,
		portainer.OperationPortainerStackInspect:              true,
		portainer.OperationPortainerStackFile:                 true,
		portainer.OperationPortainerStackCreate:               true,
		portainer.OperationPortainerStackMigrate:              true,
		portainer.OperationPortainerStackUpdate:               true,
		portainer.OperationPortainerStackDelete:               true,
		portainer.OperationPortainerWebsocketExec:             true,
		portainer.OperationPortainerWebhookList:               true,
		portainer.OperationPortainerWebhookCreate:             true,
	}

	if volumeBrowsingAuthorizations {
		authorizations[portainer.OperationDockerAgentBrowseGet] = true
		authorizations[portainer.OperationDockerAgentBrowseList] = true
		authorizations[portainer.OperationDockerAgentBrowseDelete] = true
		authorizations[portainer.OperationDockerAgentBrowsePut] = true
		authorizations[portainer.OperationDockerAgentBrowseRename] = true
	}

	return authorizations
}

// DefaultEndpointAuthorizationsForReadOnlyUserRole returns the default environment(endpoint) authorizations
// associated to the readonly user role.
func DefaultEndpointAuthorizationsForReadOnlyUserRole(volumeBrowsingAuthorizations bool) portainer.Authorizations {
	authorizations := map[portainer.Authorization]bool{
		portainer.OperationDockerContainerArchiveInfo: true,
		portainer.OperationDockerContainerList:        true,
		portainer.OperationDockerContainerChanges:     true,
		portainer.OperationDockerContainerInspect:     true,
		portainer.OperationDockerContainerTop:         true,
		portainer.OperationDockerContainerLogs:        true,
		portainer.OperationDockerContainerStats:       true,
		portainer.OperationDockerImageList:            true,
		portainer.OperationDockerImageSearch:          true,
		portainer.OperationDockerImageGetAll:          true,
		portainer.OperationDockerImageGet:             true,
		portainer.OperationDockerImageHistory:         true,
		portainer.OperationDockerImageInspect:         true,
		portainer.OperationDockerNetworkList:          true,
		portainer.OperationDockerNetworkInspect:       true,
		portainer.OperationDockerVolumeList:           true,
		portainer.OperationDockerVolumeInspect:        true,
		portainer.OperationDockerSwarmInspect:         true,
		portainer.OperationDockerNodeList:             true,
		portainer.OperationDockerNodeInspect:          true,
		portainer.OperationDockerServiceList:          true,
		portainer.OperationDockerServiceInspect:       true,
		portainer.OperationDockerServiceLogs:          true,
		portainer.OperationDockerSecretList:           true,
		portainer.OperationDockerSecretInspect:        true,
		portainer.OperationDockerConfigList:           true,
		portainer.OperationDockerConfigInspect:        true,
		portainer.OperationDockerTaskList:             true,
		portainer.OperationDockerTaskInspect:          true,
		portainer.OperationDockerTaskLogs:             true,
		portainer.OperationDockerPluginList:           true,
		portainer.OperationDockerDistributionInspect:  true,
		portainer.OperationDockerPing:                 true,
		portainer.OperationDockerInfo:                 true,
		portainer.OperationDockerVersion:              true,
		portainer.OperationDockerEvents:               true,
		portainer.OperationDockerSystem:               true,
		portainer.OperationDockerAgentPing:            true,
		portainer.OperationDockerAgentList:            true,
		portainer.OperationDockerAgentHostInfo:        true,
		portainer.OperationPortainerStackList:         true,
		portainer.OperationPortainerStackInspect:      true,
		portainer.OperationPortainerStackFile:         true,
		portainer.OperationPortainerWebhookList:       true,
	}

	if volumeBrowsingAuthorizations {
		authorizations[portainer.OperationDockerAgentBrowseGet] = true
		authorizations[portainer.OperationDockerAgentBrowseList] = true
	}

	return authorizations
}

// DefaultPortainerAuthorizations returns the default Portainer authorizations used by non-admin users.
func DefaultPortainerAuthorizations() portainer.Authorizations {
	return map[portainer.Authorization]bool{
		portainer.OperationPortainerDockerHubInspect:  true,
		portainer.OperationPortainerEndpointGroupList: true,
		portainer.OperationPortainerEndpointList:      true,
		portainer.OperationPortainerEndpointInspect:   true,
		portainer.OperationPortainerMOTD:              true,
		portainer.OperationPortainerRegistryList:      true,
		portainer.OperationPortainerRegistryInspect:   true,
		portainer.OperationPortainerTeamList:          true,
		portainer.OperationPortainerTemplateList:      true,
		portainer.OperationPortainerTemplateInspect:   true,
		portainer.OperationPortainerUserList:          true,
		portainer.OperationPortainerUserInspect:       true,
		portainer.OperationPortainerUserMemberships:   true,
		portainer.OperationPortainerUserListToken:     true,
		portainer.OperationPortainerUserCreateToken:   true,
		portainer.OperationPortainerUserRevokeToken:   true,
	}
}

// UpdateUsersAuthorizations will trigger an update of the authorizations for all the users.
func (service *Service) UpdateUsersAuthorizations() error {
	users, err := service.dataStore.User().Users()
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

func (service *Service) updateUserAuthorizations(userID portainer.UserID) error {
	user, err := service.dataStore.User().User(userID)
	if err != nil {
		return err
	}

	endpointAuthorizations, err := service.getAuthorizations(user)
	if err != nil {
		return err
	}

	user.EndpointAuthorizations = endpointAuthorizations

	return service.dataStore.User().UpdateUser(userID, user)
}

func (service *Service) getAuthorizations(user *portainer.User) (portainer.EndpointAuthorizations, error) {
	endpointAuthorizations := portainer.EndpointAuthorizations{}
	if user.Role == portainer.AdministratorRole {
		return endpointAuthorizations, nil
	}

	userMemberships, err := service.dataStore.TeamMembership().TeamMembershipsByUserID(user.ID)
	if err != nil {
		return endpointAuthorizations, err
	}

	endpoints, err := service.dataStore.Endpoint().Endpoints()
	if err != nil {
		return endpointAuthorizations, err
	}

	endpointGroups, err := service.dataStore.EndpointGroup().EndpointGroups()
	if err != nil {
		return endpointAuthorizations, err
	}

	roles, err := service.dataStore.Role().Roles()
	if err != nil {
		return endpointAuthorizations, err
	}

	endpointAuthorizations = getUserEndpointAuthorizations(user, endpoints, endpointGroups, roles, userMemberships)

	return endpointAuthorizations, nil
}

func getUserEndpointAuthorizations(user *portainer.User, endpoints []portainer.Endpoint, endpointGroups []portainer.EndpointGroup, roles []portainer.Role, userMemberships []portainer.TeamMembership) portainer.EndpointAuthorizations {
	endpointAuthorizations := make(portainer.EndpointAuthorizations)

	groupUserAccessPolicies := map[portainer.EndpointGroupID]portainer.UserAccessPolicies{}
	groupTeamAccessPolicies := map[portainer.EndpointGroupID]portainer.TeamAccessPolicies{}
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

func getAuthorizationsFromUserEndpointPolicy(user *portainer.User, endpoint *portainer.Endpoint, roles []portainer.Role) portainer.Authorizations {
	policyRoles := make([]portainer.RoleID, 0)

	policy, ok := endpoint.UserAccessPolicies[user.ID]
	if ok {
		policyRoles = append(policyRoles, policy.RoleID)
	}

	return getAuthorizationsFromRoles(policyRoles, roles)
}

func getAuthorizationsFromUserEndpointGroupPolicy(user *portainer.User, endpoint *portainer.Endpoint, roles []portainer.Role, groupAccessPolicies map[portainer.EndpointGroupID]portainer.UserAccessPolicies) portainer.Authorizations {
	policyRoles := make([]portainer.RoleID, 0)

	policy, ok := groupAccessPolicies[endpoint.GroupID][user.ID]
	if ok {
		policyRoles = append(policyRoles, policy.RoleID)
	}

	return getAuthorizationsFromRoles(policyRoles, roles)
}

func getAuthorizationsFromTeamEndpointPolicies(memberships []portainer.TeamMembership, endpoint *portainer.Endpoint, roles []portainer.Role) portainer.Authorizations {
	policyRoles := make([]portainer.RoleID, 0)

	for _, membership := range memberships {
		policy, ok := endpoint.TeamAccessPolicies[membership.TeamID]
		if ok {
			policyRoles = append(policyRoles, policy.RoleID)
		}
	}

	return getAuthorizationsFromRoles(policyRoles, roles)
}

func getAuthorizationsFromTeamEndpointGroupPolicies(memberships []portainer.TeamMembership, endpoint *portainer.Endpoint, roles []portainer.Role, groupAccessPolicies map[portainer.EndpointGroupID]portainer.TeamAccessPolicies) portainer.Authorizations {
	policyRoles := make([]portainer.RoleID, 0)

	for _, membership := range memberships {
		policy, ok := groupAccessPolicies[endpoint.GroupID][membership.TeamID]
		if ok {
			policyRoles = append(policyRoles, policy.RoleID)
		}
	}

	return getAuthorizationsFromRoles(policyRoles, roles)
}

func getAuthorizationsFromRoles(roleIdentifiers []portainer.RoleID, roles []portainer.Role) portainer.Authorizations {
	var associatedRoles []portainer.Role

	for _, id := range roleIdentifiers {
		for _, role := range roles {
			if role.ID == id {
				associatedRoles = append(associatedRoles, role)
				break
			}
		}
	}

	var authorizations portainer.Authorizations
	highestPriority := 0
	for _, role := range associatedRoles {
		if role.Priority > highestPriority {
			highestPriority = role.Priority
			authorizations = role.Authorizations
		}
	}

	return authorizations
}

func (service *Service) UserIsAdminOrAuthorized(userID portainer.UserID, endpointID portainer.EndpointID, authorizations []portainer.Authorization) (bool, error) {
	user, err := service.dataStore.User().User(userID)
	if err != nil {
		return false, err
	}
	if user.Role == portainer.AdministratorRole {
		return true, nil
	}

	for _, authorization := range authorizations {
		_, authorized := user.EndpointAuthorizations[endpointID][authorization]
		if authorized {
			return true, nil
		}
	}
	return false, nil
}
