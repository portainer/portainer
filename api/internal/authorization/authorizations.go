package authorization

import (
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	"github.com/portainer/portainer/api/kubernetes/cli"
)

// Service represents a service used to
// update authorizations associated to a user or team.
type Service struct {
	dataStore        dataservices.DataStoreTx
	K8sClientFactory *cli.ClientFactory
}

// NewService returns a point to a new Service instance.
func NewService(dataStore dataservices.DataStoreTx) *Service {
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

// RemoveTeamAccessPolicies will remove all existing access policies associated to the specified team
func (service *Service) RemoveTeamAccessPolicies(tx dataservices.DataStoreTx, teamID portainer.TeamID) error {
	endpoints, err := tx.Endpoint().Endpoints()
	if err != nil {
		return err
	}
	for _, endpoint := range endpoints {
		for policyTeamID := range endpoint.TeamAccessPolicies {
			if policyTeamID == teamID {
				delete(endpoint.TeamAccessPolicies, policyTeamID)

				err := tx.Endpoint().UpdateEndpoint(endpoint.ID, &endpoint)
				if err != nil {
					return err
				}

				break
			}
		}
	}

	endpointGroups, err := tx.EndpointGroup().ReadAll()
	if err != nil {
		return err
	}

	for _, endpointGroup := range endpointGroups {
		for policyTeamID := range endpointGroup.TeamAccessPolicies {
			if policyTeamID == teamID {
				delete(endpointGroup.TeamAccessPolicies, policyTeamID)

				err := tx.EndpointGroup().Update(endpointGroup.ID, &endpointGroup)
				if err != nil {
					return err
				}

				break
			}
		}
	}

	registries, err := tx.Registry().ReadAll()
	if err != nil {
		return err
	}

	// iterate over all environments for all registries
	// and evict all direct accesses to the registries the team had
	// we could have built a range of the teams's environments accesses while removing them above
	// but ranging over all environments (registryAccessPolicy is indexed by environmentId)
	// makes sure we cleanup all resources in case an access was not removed when a team was removed from an env
	for _, registry := range registries {
		updateRegistry := false
		for _, registryAccessPolicy := range registry.RegistryAccesses {
			if _, ok := registryAccessPolicy.TeamAccessPolicies[teamID]; ok {
				delete(registryAccessPolicy.TeamAccessPolicies, teamID)
				updateRegistry = true
			}
		}
		if updateRegistry {
			if err := tx.Registry().Update(registry.ID, &registry); err != nil {
				return err
			}
		}
	}

	return nil
}

// RemoveUserAccessPolicies will remove all existing access policies associated to the specified user
func (service *Service) RemoveUserAccessPolicies(tx dataservices.DataStoreTx, userID portainer.UserID) error {
	endpoints, err := tx.Endpoint().Endpoints()
	if err != nil {
		return err
	}

	for _, endpoint := range endpoints {
		for policyUserID := range endpoint.UserAccessPolicies {
			if policyUserID == userID {
				delete(endpoint.UserAccessPolicies, policyUserID)

				err := tx.Endpoint().UpdateEndpoint(endpoint.ID, &endpoint)
				if err != nil {
					return err
				}

				break
			}
		}
	}

	endpointGroups, err := tx.EndpointGroup().ReadAll()
	if err != nil {
		return err
	}

	for _, endpointGroup := range endpointGroups {
		for policyUserID := range endpointGroup.UserAccessPolicies {
			if policyUserID == userID {
				delete(endpointGroup.UserAccessPolicies, policyUserID)

				err := tx.EndpointGroup().Update(endpointGroup.ID, &endpointGroup)
				if err != nil {
					return err
				}

				break
			}
		}
	}

	registries, err := tx.Registry().ReadAll()
	if err != nil {
		return err
	}

	// iterate over all environments for all registries
	// and evict all direct accesses to the registries the user had
	// we could have built a range of the user's environments accesses while removing them above
	// but ranging over all environments (registryAccessPolicy is indexed by environmentId)
	// makes sure we cleanup all resources in case an access was not removed when a user was removed from an env
	for _, registry := range registries {
		updateRegistry := false
		for _, registryAccessPolicy := range registry.RegistryAccesses {
			if _, ok := registryAccessPolicy.UserAccessPolicies[userID]; ok {
				delete(registryAccessPolicy.UserAccessPolicies, userID)
				updateRegistry = true
			}
		}
		if updateRegistry {
			if err := tx.Registry().Update(registry.ID, &registry); err != nil {
				return err
			}
		}
	}

	return nil
}

// UpdateUsersAuthorizations is a no-op kept for backward compatibility with database migrations.
//
// Deprecated: This function previously populated the User.EndpointAuthorizations field which is
// no longer used. Authorization is now computed dynamically via ResolveUserEndpointAccess.
func (service *Service) UpdateUsersAuthorizations() error {
	return nil
}

func (service *Service) UserIsAdminOrAuthorized(tx dataservices.DataStoreTx, userID portainer.UserID, endpointID portainer.EndpointID, authorizations []portainer.Authorization) (bool, error) {
	user, err := tx.User().Read(userID)
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
