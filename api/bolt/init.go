package bolt

import (
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/bolt/errors"
)

// Init creates the default data set.
func (store *Store) Init() error {
	_, err := store.SettingsService.Settings()
	if err == errors.ErrObjectNotFound {
		defaultSettings := &portainer.Settings{
			AuthenticationMethod: portainer.AuthenticationInternal,
			BlackListedLabels:    make([]portainer.Pair, 0),
			LDAPSettings: portainer.LDAPSettings{
				AnonymousMode:   true,
				AutoCreateUsers: true,
				TLSConfig:       portainer.TLSConfiguration{},
				SearchSettings: []portainer.LDAPSearchSettings{
					portainer.LDAPSearchSettings{},
				},
				GroupSearchSettings: []portainer.LDAPGroupSearchSettings{
					portainer.LDAPGroupSearchSettings{},
				},
			},
			OAuthSettings:                             portainer.OAuthSettings{},
			AllowBindMountsForRegularUsers:            true,
			AllowPrivilegedModeForRegularUsers:        true,
			AllowVolumeBrowserForRegularUsers:         false,
			AllowHostNamespaceForRegularUsers:         true,
			AllowDeviceMappingForRegularUsers:         true,
			AllowStackManagementForRegularUsers:       true,
			AllowContainerCapabilitiesForRegularUsers: true,
			EnableHostManagementFeatures:              false,
			EdgeAgentCheckinInterval:                  portainer.DefaultEdgeAgentCheckinIntervalInSeconds,
			TemplatesURL:                              portainer.DefaultTemplatesURL,
			UserSessionTimeout:                        portainer.DefaultUserSessionTimeout,
		}

		err = store.SettingsService.UpdateSettings(defaultSettings)
		if err != nil {
			return err
		}
	} else if err != nil {
		return err
	}

	_, err = store.DockerHubService.DockerHub()
	if err == errors.ErrObjectNotFound {
		defaultDockerHub := &portainer.DockerHub{
			Authentication: false,
			Username:       "",
			Password:       "",
		}

		err := store.DockerHubService.UpdateDockerHub(defaultDockerHub)
		if err != nil {
			return err
		}
	} else if err != nil {
		return err
	}

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
			TagIDs:             []portainer.TagID{},
		}

		err = store.EndpointGroupService.CreateEndpointGroup(unassignedGroup)
		if err != nil {
			return err
		}
	}

	return nil
}
