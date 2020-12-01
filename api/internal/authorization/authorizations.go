package authorization

import (
	portainer "github.com/portainer/portainer/api"
)

// Service represents a service used to
// update authorizations associated to a user or team.
type (
	Service struct {
		dataStore         portainer.DataStore
		authEventHandlers map[string]portainer.AuthEventHandler
	}
)

// NewService returns a point to a new Service instance.
func NewService(dataStore portainer.DataStore) *Service {
	return &Service{
		dataStore:         dataStore,
		authEventHandlers: make(map[string]portainer.AuthEventHandler),
	}
}

// DefaultEndpointAuthorizationsForEndpointAdministratorRole returns the default endpoint authorizations
// associated to the endpoint administrator role.
func DefaultEndpointAuthorizationsForEndpointAdministratorRole() portainer.Authorizations {
	return unionAuthorizations(map[portainer.Authorization]bool{
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
		portainer.OperationIntegrationStoridgeAdmin:           true,
		portainer.EndpointResourcesAccess:                     true,
	}, DefaultK8sClusterAuthorizations()[portainer.RoleIDEndpointAdmin])
}

// DefaultEndpointAuthorizationsForHelpDeskRole returns the default endpoint authorizations
// associated to the helpdesk role.
func DefaultEndpointAuthorizationsForHelpDeskRole(volumeBrowsingAuthorizations bool) portainer.Authorizations {
	authorizations := unionAuthorizations(map[portainer.Authorization]bool{
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
	}, DefaultK8sClusterAuthorizations()[portainer.RoleIDHelpdesk])

	if volumeBrowsingAuthorizations {
		authorizations[portainer.OperationDockerAgentBrowseGet] = true
		authorizations[portainer.OperationDockerAgentBrowseList] = true
	}

	return authorizations
}

// DefaultEndpointAuthorizationsForStandardUserRole returns the default endpoint authorizations
// associated to the standard user role.
func DefaultEndpointAuthorizationsForStandardUserRole(volumeBrowsingAuthorizations bool) portainer.Authorizations {
	authorizations := unionAuthorizations(map[portainer.Authorization]bool{
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
	}, DefaultK8sClusterAuthorizations()[portainer.RoleIDStandardUser])

	if volumeBrowsingAuthorizations {
		authorizations[portainer.OperationDockerAgentBrowseGet] = true
		authorizations[portainer.OperationDockerAgentBrowseList] = true
		authorizations[portainer.OperationDockerAgentBrowseDelete] = true
		authorizations[portainer.OperationDockerAgentBrowsePut] = true
		authorizations[portainer.OperationDockerAgentBrowseRename] = true
	}

	return authorizations
}

// DefaultEndpointAuthorizationsForReadOnlyUserRole returns the default endpoint authorizations
// associated to the readonly user role.
func DefaultEndpointAuthorizationsForReadOnlyUserRole(volumeBrowsingAuthorizations bool) portainer.Authorizations {
	authorizations := unionAuthorizations(map[portainer.Authorization]bool{
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
	}, DefaultK8sClusterAuthorizations()[portainer.RoleIDReadonly])

	if volumeBrowsingAuthorizations {
		authorizations[portainer.OperationDockerAgentBrowseGet] = true
		authorizations[portainer.OperationDockerAgentBrowseList] = true
	}

	return authorizations
}

// DefaultPortainerAuthorizations returns the default Portainer authorizations used by non-admin users.
func DefaultPortainerAuthorizations() portainer.Authorizations {
	return map[portainer.Authorization]bool{
		portainer.OperationPortainerEndpointGroupInspect:    true,
		portainer.OperationPortainerEndpointGroupList:       true,
		portainer.OperationPortainerDockerHubInspect:        true,
		portainer.OperationPortainerEndpointList:            true,
		portainer.OperationPortainerEndpointInspect:         true,
		portainer.OperationPortainerEndpointExtensionAdd:    true,
		portainer.OperationPortainerEndpointExtensionRemove: true,
		portainer.OperationPortainerMOTD:                    true,
		portainer.OperationPortainerRoleList:                true,
		portainer.OperationPortainerRegistryList:            true,
		portainer.OperationPortainerRegistryInspect:         true,
		portainer.OperationPortainerTeamList:                true,
		portainer.OperationPortainerTemplateList:            true,
		portainer.OperationPortainerTemplateInspect:         true,
		portainer.OperationPortainerUserList:                true,
		portainer.OperationPortainerUserInspect:             true,
		portainer.OperationPortainerUserMemberships:         true,
	}
}

// RegisterEventHandler upserts event handler by id
func (service *Service) RegisterEventHandler(id string, handler portainer.AuthEventHandler) {
	service.authEventHandlers[id] = handler
}

// TriggerUserAuthUpdate triggers all users auth update event on the registered
// event handlers (e.g. token cache manager)
func (service *Service) TriggerUsersAuthUpdate() {
	for _, handler := range service.authEventHandlers {
		handler.HandleUsersAuthUpdate()
	}
}

// TriggerUserAuthUpdate triggers single user auth update event on the registered
// event handlers (e.g. token cache manager)
func (service *Service) TriggerUserAuthUpdate(userID int) {
	for _, handler := range service.authEventHandlers {
		handler.HandleUserAuthDelete(userID)
	}
}

// UpdateVolumeBrowsingAuthorizations will update all the volume browsing authorizations for each role (except endpoint administrator)
// based on the specified removeAuthorizations parameter. If removeAuthorizations is set to true, all
// the authorizations will be dropped for the each role. If removeAuthorizations is set to false, the authorizations
// will be reset based for each role.
func (service Service) UpdateVolumeBrowsingAuthorizations(remove bool) error {
	roles, err := service.dataStore.Role().Roles()
	if err != nil {
		return err
	}

	for _, role := range roles {
		// all roles except endpoint administrator
		if role.ID != portainer.RoleID(1) {
			updateRoleVolumeBrowsingAuthorizations(&role, remove)

			err := service.dataStore.Role().UpdateRole(role.ID, &role)
			if err != nil {
				return err
			}
		}
	}

	return nil
}

func updateRoleVolumeBrowsingAuthorizations(role *portainer.Role, removeAuthorizations bool) {
	if !removeAuthorizations {
		delete(role.Authorizations, portainer.OperationDockerAgentBrowseDelete)
		delete(role.Authorizations, portainer.OperationDockerAgentBrowseGet)
		delete(role.Authorizations, portainer.OperationDockerAgentBrowseList)
		delete(role.Authorizations, portainer.OperationDockerAgentBrowsePut)
		delete(role.Authorizations, portainer.OperationDockerAgentBrowseRename)
		return
	}

	role.Authorizations[portainer.OperationDockerAgentBrowseGet] = true
	role.Authorizations[portainer.OperationDockerAgentBrowseList] = true

	// Standard-user
	if role.ID == portainer.RoleID(3) {
		role.Authorizations[portainer.OperationDockerAgentBrowseDelete] = true
		role.Authorizations[portainer.OperationDockerAgentBrowsePut] = true
		role.Authorizations[portainer.OperationDockerAgentBrowseRename] = true
	}
}

// RemoveTeamAccessPolicies will remove all existing access policies associated to the specified team
func (service *Service) RemoveTeamAccessPolicies(teamID portainer.TeamID) error {
	endpoints, err := service.dataStore.Endpoint().Endpoints()
	if err != nil {
		return err
	}

	for _, endpoint := range endpoints {
		for policyTeamID := range endpoint.TeamAccessPolicies {
			if policyTeamID == teamID {
				delete(endpoint.TeamAccessPolicies, policyTeamID)

				err := service.dataStore.Endpoint().UpdateEndpoint(endpoint.ID, &endpoint)
				if err != nil {
					return err
				}

				break
			}
		}
	}

	endpointGroups, err := service.dataStore.EndpointGroup().EndpointGroups()
	if err != nil {
		return err
	}

	for _, endpointGroup := range endpointGroups {
		for policyTeamID := range endpointGroup.TeamAccessPolicies {
			if policyTeamID == teamID {
				delete(endpointGroup.TeamAccessPolicies, policyTeamID)

				err := service.dataStore.EndpointGroup().UpdateEndpointGroup(endpointGroup.ID, &endpointGroup)
				if err != nil {
					return err
				}

				break
			}
		}
	}

	registries, err := service.dataStore.Registry().Registries()
	if err != nil {
		return err
	}

	for _, registry := range registries {
		for policyTeamID := range registry.TeamAccessPolicies {
			if policyTeamID == teamID {
				delete(registry.TeamAccessPolicies, policyTeamID)

				err := service.dataStore.Registry().UpdateRegistry(registry.ID, &registry)
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
func (service *Service) RemoveUserAccessPolicies(userID portainer.UserID) error {
	endpoints, err := service.dataStore.Endpoint().Endpoints()
	if err != nil {
		return err
	}

	for _, endpoint := range endpoints {
		for policyUserID := range endpoint.UserAccessPolicies {
			if policyUserID == userID {
				delete(endpoint.UserAccessPolicies, policyUserID)

				err := service.dataStore.Endpoint().UpdateEndpoint(endpoint.ID, &endpoint)
				if err != nil {
					return err
				}

				break
			}
		}
	}

	endpointGroups, err := service.dataStore.EndpointGroup().EndpointGroups()
	if err != nil {
		return err
	}

	for _, endpointGroup := range endpointGroups {
		for policyUserID := range endpointGroup.UserAccessPolicies {
			if policyUserID == userID {
				delete(endpointGroup.UserAccessPolicies, policyUserID)

				err := service.dataStore.EndpointGroup().UpdateEndpointGroup(endpointGroup.ID, &endpointGroup)
				if err != nil {
					return err
				}

				break
			}
		}
	}

	registries, err := service.dataStore.Registry().Registries()
	if err != nil {
		return err
	}

	for _, registry := range registries {
		for policyUserID := range registry.UserAccessPolicies {
			if policyUserID == userID {
				delete(registry.UserAccessPolicies, policyUserID)

				err := service.dataStore.Registry().UpdateRegistry(registry.ID, &registry)
				if err != nil {
					return err
				}

				break
			}
		}
	}

	service.TriggerUserAuthUpdate(int(userID))

	return nil
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

	service.TriggerUsersAuthUpdate()

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

func getUserEndpointAuthorizations(user *portainer.User, endpoints []portainer.Endpoint,
	endpointGroups []portainer.EndpointGroup, roles []portainer.Role,
	userMemberships []portainer.TeamMembership) portainer.EndpointAuthorizations {

	endpointAuthorizations := make(portainer.EndpointAuthorizations)
	for endpointID, role := range getUserEndpointRoles(user, endpoints,
		endpointGroups, roles, userMemberships) {
		endpointAuthorizations[endpointID] = role.Authorizations
	}

	return endpointAuthorizations
}

// get the user and team policies from the endpoint group definitions
func getGroupPolicies(endpointGroups []portainer.EndpointGroup) (
	map[portainer.EndpointGroupID]portainer.UserAccessPolicies,
	map[portainer.EndpointGroupID]portainer.TeamAccessPolicies,
) {
	groupUserAccessPolicies := map[portainer.EndpointGroupID]portainer.UserAccessPolicies{}
	groupTeamAccessPolicies := map[portainer.EndpointGroupID]portainer.TeamAccessPolicies{}
	for _, endpointGroup := range endpointGroups {
		groupUserAccessPolicies[endpointGroup.ID] = endpointGroup.UserAccessPolicies
		groupTeamAccessPolicies[endpointGroup.ID] = endpointGroup.TeamAccessPolicies
	}
	return groupUserAccessPolicies, groupTeamAccessPolicies
}

// UpdateUserNamespaceAccessPolicies takes an input accessPolicies
// and updates it with the user and his team's endpoint roles.
// Returns the updated policies and whether there is any update.
func (service *Service) UpdateUserNamespaceAccessPolicies(
	userID int, endpoint *portainer.Endpoint,
	policiesToUpdate map[string]portainer.K8sNamespaceAccessPolicy,
) (map[string]portainer.K8sNamespaceAccessPolicy, bool, error) {
	endpointID := int(endpoint.ID)
	restrictDefaultNamespace := endpoint.Kubernetes.Configuration.RestrictDefaultNamespace

	userRole, err := service.GetUserEndpointRole(userID, endpointID)
	if err != nil {
		return nil, false, err
	}
	usersEndpointRole := make(map[int]int)
	teamsEndpointRole := make(map[int]int)
	if userRole != nil {
		usersEndpointRole[userID] = int(userRole.ID)
	} else {
		usersEndpointRole[userID] = -1
	}

	userMemberships, err := service.dataStore.TeamMembership().
		TeamMembershipsByUserID(portainer.UserID(userID))
	if err != nil {
		return nil, false, err
	}
	teamIDs := make([]int, 0)
	for _, membership := range userMemberships {
		teamRole, err := service.GetTeamEndpointRole(int(membership.TeamID), endpointID)
		if err != nil {
			return nil, false, err
		}
		if teamRole != nil {
			teamsEndpointRole[int(membership.TeamID)] = int(teamRole.ID)
			teamIDs = append(teamIDs, int(membership.TeamID))
		}
	}
	return service.updateNamespaceAccessPolicies(userID, teamIDs, usersEndpointRole, teamsEndpointRole,
		policiesToUpdate, restrictDefaultNamespace)
}

// updateNamespaceAccessPolicies takes an input accessPolicies
// and updates it with the endpoint users/teams roles.
func (service *Service) updateNamespaceAccessPolicies(
	selectedUserID int, selectedTeamIDs []int,
	usersEndpointRole map[int]int, teamsEndpointRole map[int]int,
	policiesToUpdate map[string]portainer.K8sNamespaceAccessPolicy,
	restrictDefaultNamespace bool,
) (map[string]portainer.K8sNamespaceAccessPolicy, bool, error) {
	hasChange := false
	if !restrictDefaultNamespace {
		delete(policiesToUpdate, "default")
		hasChange = true
	}
	for ns, nsPolicies := range policiesToUpdate {
		for userID, policy := range nsPolicies.UserAccessPolicies {
			if int(userID) == selectedUserID {
				iRoleID, ok := usersEndpointRole[int(userID)]
				if !ok {
					delete(nsPolicies.UserAccessPolicies, userID)
					hasChange = true
				} else if int(policy.RoleID) != iRoleID {
					nsPolicies.UserAccessPolicies[userID] = portainer.AccessPolicy{
						RoleID: portainer.RoleID(iRoleID),
					}
					hasChange = true
				}
			}
		}
		for teamID, policy := range nsPolicies.TeamAccessPolicies {
			for _, selectedTeamID := range selectedTeamIDs {
				if int(teamID) == selectedTeamID {
					iRoleID, ok := teamsEndpointRole[int(teamID)]
					if !ok {
						delete(nsPolicies.TeamAccessPolicies, teamID)
						hasChange = true
					} else if int(policy.RoleID) != iRoleID {
						nsPolicies.TeamAccessPolicies[teamID] = portainer.AccessPolicy{
							RoleID: portainer.RoleID(iRoleID),
						}
						hasChange = true
					}
				}
			}
		}
		policiesToUpdate[ns] = nsPolicies
	}
	return policiesToUpdate, hasChange, nil
}

// RemoveUserNamespaceAccessPolicies takes an input accessPolicies
// and remove users/teams in it.
// Returns the updated policies and whether there is any update.
func (service *Service) RemoveUserNamespaceAccessPolicies(
	userID int, endpointID int,
	policiesToUpdate map[string]portainer.K8sNamespaceAccessPolicy,
) (map[string]portainer.K8sNamespaceAccessPolicy, bool, error) {
	userRole, err := service.GetUserEndpointRole(userID, endpointID)
	if err != nil {
		return nil, false, err
	}
	usersEndpointRole := make(map[int]int)
	if userRole != nil {
		usersEndpointRole[userID] = int(userRole.ID)
	}
	return service.removeUserInNamespaceAccessPolicies(usersEndpointRole, policiesToUpdate)
}

// removeUserInNamespaceAccessPolicies takes an input accessPolicies
// and remove users/teams in it.
func (service *Service) removeUserInNamespaceAccessPolicies(
	usersEndpointRole map[int]int,
	policiesToUpdate map[string]portainer.K8sNamespaceAccessPolicy,
) (map[string]portainer.K8sNamespaceAccessPolicy, bool, error) {
	hasChange := false
	for ns, nsPolicies := range policiesToUpdate {
		for userID := range nsPolicies.UserAccessPolicies {
			_, ok := usersEndpointRole[int(userID)]
			if ok {
				delete(nsPolicies.UserAccessPolicies, userID)
				hasChange = true
			}
		}
		if len(nsPolicies.UserAccessPolicies) == 0 && len(nsPolicies.TeamAccessPolicies) == 0 {
			delete(policiesToUpdate, ns)
		} else {
			policiesToUpdate[ns] = nsPolicies
		}
	}
	return policiesToUpdate, hasChange, nil
}

// RemoveTeamsNamespaceAccessPolicies takes an input accessPolicies
// and remove teams in it.
// Returns the updated policies and whether there is any update.
func (service *Service) RemoveTeamNamespaceAccessPolicies(
	teamID int, endpointID int,
	policiesToUpdate map[string]portainer.K8sNamespaceAccessPolicy,
) (map[string]portainer.K8sNamespaceAccessPolicy, bool, error) {
	teamRole, err := service.GetTeamEndpointRole(teamID, endpointID)
	if err != nil {
		return nil, false, err
	}
	if teamRole == nil {
		return nil, false, nil
	}
	teamsEndpointRole := make(map[int]int)
	teamsEndpointRole[teamID] = int(teamRole.ID)

	hasChange := false
	for ns, nsPolicies := range policiesToUpdate {
		for teamID := range nsPolicies.TeamAccessPolicies {
			_, ok := teamsEndpointRole[int(teamID)]
			if ok {
				delete(nsPolicies.TeamAccessPolicies, teamID)
				hasChange = true
			}
		}
		if len(nsPolicies.UserAccessPolicies) == 0 && len(nsPolicies.TeamAccessPolicies) == 0 {
			delete(policiesToUpdate, ns)
		} else {
			policiesToUpdate[ns] = nsPolicies
		}
	}
	return policiesToUpdate, hasChange, nil
}

// GetUserEndpointRole returns the endpoint role of the user.
// It returns nil if there is no role assigned to the user at the endpoint.
func (service *Service) GetUserEndpointRole(
	userID int,
	endpointID int,
) (*portainer.Role, error) {
	user, err := service.dataStore.User().User(portainer.UserID(userID))
	if err != nil {
		return nil, err
	}

	userMemberships, err := service.dataStore.TeamMembership().TeamMembershipsByUserID(user.ID)
	if err != nil {
		return nil, err
	}

	endpoint, err := service.dataStore.Endpoint().Endpoint(portainer.EndpointID(endpointID))
	if err != nil {
		return nil, err
	}

	endpointGroups, err := service.dataStore.EndpointGroup().EndpointGroups()
	if err != nil {
		return nil, err
	}

	roles, err := service.dataStore.Role().Roles()
	if err != nil {
		return nil, err
	}

	groupUserAccessPolicies, groupTeamAccessPolicies := getGroupPolicies(endpointGroups)

	return getUserEndpointRole(user, *endpoint, groupUserAccessPolicies,
		groupTeamAccessPolicies, roles, userMemberships), nil
}

func (service *Service) GetNamespaceAuthorizations(
	userID int,
	endpoint portainer.Endpoint,
	kcl portainer.KubeClient,
) (map[string]portainer.Authorizations, error) {
	namespaceAuthorizations := make(map[string]portainer.Authorizations)

	// skip non k8s endpoints
	if endpoint.Type != portainer.KubernetesLocalEnvironment &&
		endpoint.Type != portainer.AgentOnKubernetesEnvironment &&
		endpoint.Type != portainer.EdgeAgentOnKubernetesEnvironment {
		return namespaceAuthorizations, nil
	}

	endpointRole, err := service.GetUserEndpointRole(userID, int(endpoint.ID))
	if err != nil {
		return nil, err
	}

	// no endpoint role for the user, continue
	if endpointRole == nil {
		return namespaceAuthorizations, nil
	}

	namespaces, err := kcl.GetNamespaces()
	if err != nil {
		return nil, err
	}

	accessPolicies, err := kcl.GetNamespaceAccessPolicies()
	if err != nil {
		return nil, err
	}
	// update the namespace access policies based on user's role, also in configmap.
	accessPolicies, hasChange, err := service.UpdateUserNamespaceAccessPolicies(
		userID, &endpoint, accessPolicies,
	)
	if hasChange {
		err = kcl.UpdateNamespaceAccessPolicies(accessPolicies)
		if err != nil {
			return nil, err
		}
	}

	namespaceAuthorizations, err = service.GetUserNamespaceAuthorizations(
		userID, int(endpointRole.ID), int(endpoint.ID), accessPolicies, namespaces, endpointRole.Authorizations,
		endpoint.Kubernetes.Configuration,
	)
	if err != nil {
		return nil, err
	}

	return namespaceAuthorizations, nil
}

// GetUserNamespaceAuthorizations returns authorizations of a user's namespaces
func (service *Service) GetUserNamespaceAuthorizations(
	userID int,
	userEndpointRoleID int,
	endpointID int,
	accessPolicies map[string]portainer.K8sNamespaceAccessPolicy,
	namespaces map[string]portainer.K8sNamespaceInfo,
	endpointAuthorizations portainer.Authorizations,
	endpointConfiguration portainer.KubernetesConfiguration,
) (map[string]portainer.Authorizations, error) {
	namespaceRoles, err := service.GetUserNamespaceRoles(userID, userEndpointRoleID, endpointID,
		accessPolicies, namespaces, endpointAuthorizations, endpointConfiguration)
	if err != nil {
		return nil, err
	}

	defaultAuthorizations := DefaultK8sNamespaceAuthorizations()

	namespaceAuthorizations := make(map[string]portainer.Authorizations)
	for namespace, role := range namespaceRoles {
		namespaceAuthorizations[namespace] = defaultAuthorizations[role.ID]
	}

	return namespaceAuthorizations, nil
}

// GetUserNamespaceRoles returns the endpoint role of the user.
func (service *Service) GetUserNamespaceRoles(
	userID int,
	userEndpointRoleID int,
	endpointID int,
	accessPolicies map[string]portainer.K8sNamespaceAccessPolicy,
	namespaces map[string]portainer.K8sNamespaceInfo,
	endpointAuthorizations portainer.Authorizations,
	endpointConfiguration portainer.KubernetesConfiguration,
) (map[string]portainer.Role, error) {

	// does an early check if user can access all namespaces to skip db calls
	accessAllNamespaces := endpointAuthorizations[portainer.OperationK8sAccessAllNamespaces]
	if accessAllNamespaces {
		return make(map[string]portainer.Role), nil
	}

	user, err := service.dataStore.User().User(portainer.UserID(userID))
	if err != nil {
		return nil, err
	}

	userMemberships, err := service.dataStore.TeamMembership().TeamMembershipsByUserID(user.ID)
	if err != nil {
		return nil, err
	}

	roles, err := service.dataStore.Role().Roles()
	if err != nil {
		return nil, err
	}

	accessSystemNamespaces := endpointAuthorizations[portainer.OperationK8sAccessSystemNamespaces]
	accessUserNamespaces := endpointAuthorizations[portainer.OperationK8sAccessUserNamespaces]

	return getUserNamespaceRoles(user, userEndpointRoleID, roles, userMemberships,
		accessPolicies, namespaces, accessAllNamespaces, accessSystemNamespaces,
		accessUserNamespaces, endpointConfiguration.RestrictDefaultNamespace)
}

func getUserNamespaceRoles(
	user *portainer.User,
	userEndpointRoleID int,
	roles []portainer.Role,
	userMemberships []portainer.TeamMembership,
	accessPolicies map[string]portainer.K8sNamespaceAccessPolicy,
	namespaces map[string]portainer.K8sNamespaceInfo,
	accessAllNamespaces bool,
	accessSystemNamespaces bool,
	accessUserNamespaces bool,
	restrictDefaultNamespace bool,
) (map[string]portainer.Role, error) {
	rolesMap := make(map[int]portainer.Role)
	results := make(map[string]portainer.Role)

	for namespace, info := range namespaces {
		// user can access everything
		if accessAllNamespaces {
			results[namespace] = rolesMap[userEndpointRoleID]
		}

		// skip default namespace or system namespace (when user don't have access)
		if !accessSystemNamespaces && info.IsSystem {
			continue
		}

		// default namespace doesn't allow permission management so no role
		// aggregation needed
		if !restrictDefaultNamespace && info.IsDefault {
			results[namespace] = rolesMap[userEndpointRoleID]
		}

		// user can access user namespaces
		if accessUserNamespaces && !info.IsSystem && !info.IsDefault {
			results[namespace] = rolesMap[userEndpointRoleID]
		}

		// if there is an access policy for the current namespace
		if policies, ok := accessPolicies[namespace]; ok {
			role := getUserNamespaceRole(
				user,
				policies.UserAccessPolicies,
				policies.TeamAccessPolicies,
				roles,
				userMemberships,
			)
			if role != nil {
				results[namespace] = *role
			}
		}
	}

	return results, nil
}

// For each namespace, first calculate the role(s) of a user
// based on the sequence of searching:
//  - His namespace role (single)
//  - His teams namespace role (multiple, 1 user has n teams)
//
// If roles are found in any of the step, the search stops.
// Then the role with the hightest priority is returned.
func getUserNamespaceRole(
	user *portainer.User,
	userAccessPolicies portainer.UserAccessPolicies,
	teamAccessPolicies portainer.TeamAccessPolicies,
	roles []portainer.Role,
	userMemberships []portainer.TeamMembership,
) *portainer.Role {

	role := getRoleFromUserAccessPolicies(user, userAccessPolicies, roles)
	if role != nil {
		return role
	}

	role = getRoleFromTeamAccessPolicies(userMemberships, teamAccessPolicies, roles)
	return role
}

// For each endpoint, first calculate the role(s) of a team
// based on the sequence of searching:
//  - Team's endpoint role (multiple, 1 user has n teams)
//  - Team's roles in all the assigned endpoint groups (multiple, 1 user has n teams, 1 team has 1 endpoint group)
//
// If roles are found in any of the step, the search stops.
// Then the role with the hightest priority is returned.
func (service *Service) GetTeamEndpointRole(
	teamID int, endpointID int,
) (*portainer.Role, error) {

	memberships, err := service.dataStore.TeamMembership().TeamMembershipsByTeamID(portainer.TeamID(teamID))
	if err != nil {
		return nil, err
	}

	endpoint, err := service.dataStore.Endpoint().Endpoint(portainer.EndpointID(endpointID))
	if err != nil {
		return nil, err
	}

	endpointGroups, err := service.dataStore.EndpointGroup().EndpointGroups()
	if err != nil {
		return nil, err
	}

	roles, err := service.dataStore.Role().Roles()
	if err != nil {
		return nil, err
	}

	_, groupTeamAccessPolicies := getGroupPolicies(endpointGroups)

	role := getRoleFromTeamAccessPolicies(memberships,
		endpoint.TeamAccessPolicies, roles)
	if role != nil {
		return role, nil
	}

	role = getRoleFromTeamEndpointGroupPolicies(memberships, endpoint,
		roles, groupTeamAccessPolicies)
	return role, nil
}

// For each endpoint, first calculate the role(s) of a user
// based on the sequence of searching:
//  - His endpoint role (single)
//  - His endpoint group role (single, 1 endpoint has 1 endpoint group)
//  - His teams endpoint role (multiple, 1 user has n teams)
//  - His teams roles in all the assigned endpoint groups (multiple, 1 user has n teams, 1 team has 1 endpoint group)
//
// If roles are found in any of the step, the search stops.
// Then the role with the hightest priority is returned.
func getUserEndpointRole(user *portainer.User, endpoint portainer.Endpoint,
	groupUserAccessPolicies map[portainer.EndpointGroupID]portainer.UserAccessPolicies,
	groupTeamAccessPolicies map[portainer.EndpointGroupID]portainer.TeamAccessPolicies,
	roles []portainer.Role,
	userMemberships []portainer.TeamMembership,
) *portainer.Role {

	role := getRoleFromUserAccessPolicies(user, endpoint.UserAccessPolicies, roles)
	if role != nil {
		return role
	}

	role = getRoleFromUserEndpointGroupPolicy(user, &endpoint, roles, groupUserAccessPolicies)
	if role != nil {
		return role
	}

	role = getRoleFromTeamAccessPolicies(userMemberships, endpoint.TeamAccessPolicies, roles)
	if role != nil {
		return role
	}

	role = getRoleFromTeamEndpointGroupPolicies(userMemberships, &endpoint, roles, groupTeamAccessPolicies)
	return role
}

func getUserEndpointRoles(user *portainer.User, endpoints []portainer.Endpoint,
	endpointGroups []portainer.EndpointGroup, roles []portainer.Role,
	userMemberships []portainer.TeamMembership) map[portainer.EndpointID]portainer.Role {
	results := make(map[portainer.EndpointID]portainer.Role)

	groupUserAccessPolicies, groupTeamAccessPolicies := getGroupPolicies(endpointGroups)

	for _, endpoint := range endpoints {
		role := getUserEndpointRole(user, endpoint, groupUserAccessPolicies,
			groupTeamAccessPolicies, roles, userMemberships)
		if role != nil {
			results[endpoint.ID] = *role
			continue
		}
	}

	return results
}

// A user may have 1 role in each assigned Endpoints.
func getRoleFromUserAccessPolicies(
	user *portainer.User,
	userAccessPolicies portainer.UserAccessPolicies,
	roles []portainer.Role,
) *portainer.Role {
	policyRoles := make([]portainer.RoleID, 0)

	policy, ok := userAccessPolicies[user.ID]
	if ok {
		policyRoles = append(policyRoles, policy.RoleID)
	}
	if len(policyRoles) == 0 {
		return nil
	}

	return getKeyRole(policyRoles, roles)
}

// An endpoint can only have 1 EndpointGroup.
//
// A user may have 1 role in each assigned EndpointGroups.
func getRoleFromUserEndpointGroupPolicy(user *portainer.User,
	endpoint *portainer.Endpoint, roles []portainer.Role,
	groupAccessPolicies map[portainer.EndpointGroupID]portainer.UserAccessPolicies) *portainer.Role {
	policyRoles := make([]portainer.RoleID, 0)

	policy, ok := groupAccessPolicies[endpoint.GroupID][user.ID]
	if ok {
		policyRoles = append(policyRoles, policy.RoleID)
	}
	if len(policyRoles) == 0 {
		return nil
	}

	return getKeyRole(policyRoles, roles)
}

// A team may have 1 role in each assigned Endpoints
func getRoleFromTeamAccessPolicies(
	memberships []portainer.TeamMembership,
	teamAccessPolicies portainer.TeamAccessPolicies,
	roles []portainer.Role,
) *portainer.Role {
	policyRoles := make([]portainer.RoleID, 0)

	for _, membership := range memberships {
		policy, ok := teamAccessPolicies[membership.TeamID]
		if ok {
			policyRoles = append(policyRoles, policy.RoleID)
		}
	}
	if len(policyRoles) == 0 {
		return nil
	}

	return getKeyRole(policyRoles, roles)
}

// An endpoint can only have 1 EndpointGroup.
//
// A team may have 1 role in each assigned EndpointGroups.
func getRoleFromTeamEndpointGroupPolicies(memberships []portainer.TeamMembership,
	endpoint *portainer.Endpoint, roles []portainer.Role,
	groupTeamAccessPolicies map[portainer.EndpointGroupID]portainer.TeamAccessPolicies) *portainer.Role {
	policyRoles := make([]portainer.RoleID, 0)

	for _, membership := range memberships {
		policy, ok := groupTeamAccessPolicies[endpoint.GroupID][membership.TeamID]
		if ok {
			policyRoles = append(policyRoles, policy.RoleID)
		}
	}
	if len(policyRoles) == 0 {
		return nil
	}

	return getKeyRole(policyRoles, roles)
}

// for each role in the roleIdentifiers,
// find the highest priority role and returns its authorizations
func getAuthorizationsFromRoles(roleIdentifiers []portainer.RoleID, roles []portainer.Role) portainer.Authorizations {
	keyRole := getKeyRole(roleIdentifiers, roles)

	if keyRole == nil {
		return portainer.Authorizations{}
	}

	return keyRole.Authorizations
}

// for each role in the roleIdentifiers,
// find the highest priority role
func getKeyRole(roleIdentifiers []portainer.RoleID, roles []portainer.Role) *portainer.Role {
	var associatedRoles []portainer.Role

	for _, id := range roleIdentifiers {
		for _, role := range roles {
			if role.ID == id {
				associatedRoles = append(associatedRoles, role)
				break
			}
		}
	}

	result := &portainer.Role{}
	for _, role := range associatedRoles {
		if role.Priority > result.Priority {
			result = &role
		}
	}

	return result
}

// unionAuthorizations returns a union of all the input authorizations
// using the "or" operator.
func unionAuthorizations(auths ...portainer.Authorizations) portainer.Authorizations {
	authorizations := make(portainer.Authorizations)

	for _, auth := range auths {
		for authKey, authVal := range auth {
			if val, ok := authorizations[authKey]; ok {
				authorizations[authKey] = val || authVal
			} else {
				authorizations[authKey] = authVal
			}
		}
	}

	return authorizations
}
