package bolt

import (
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/bolt/errors"
	"github.com/portainer/portainer/api/internal/authorization"
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
			OAuthSettings:                      portainer.OAuthSettings{},
			AllowBindMountsForRegularUsers:     true,
			AllowPrivilegedModeForRegularUsers: true,
			AllowVolumeBrowserForRegularUsers:  false,
			EnableHostManagementFeatures:       false,
			EdgeAgentCheckinInterval:           portainer.DefaultEdgeAgentCheckinIntervalInSeconds,
			TemplatesURL:                       portainer.DefaultTemplatesURL,
			UserSessionTimeout:                 portainer.DefaultUserSessionTimeout,
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

	roles, err := store.RoleService.Roles()
	if err != nil {
		return err
	}

	if len(roles) == 0 {
		environmentAdministratorRole := &portainer.Role{
			Name:           "Endpoint administrator",
			Description:    "Full control of all resources in an endpoint",
			Priority:       1,
			Authorizations: authorization.DefaultEndpointAuthorizationsForEndpointAdministratorRole(),
		}

		err = store.RoleService.CreateRole(environmentAdministratorRole)
		if err != nil {
			return err
		}

		environmentReadOnlyUserRole := &portainer.Role{
			Name:           "Helpdesk",
			Description:    "Read-only access of all resources in an endpoint",
			Priority:       2,
			Authorizations: authorization.DefaultEndpointAuthorizationsForHelpDeskRole(false),
		}

		err = store.RoleService.CreateRole(environmentReadOnlyUserRole)
		if err != nil {
			return err
		}

		standardUserRole := &portainer.Role{
			Name:           "Standard user",
			Description:    "Full control of assigned resources in an endpoint",
			Priority:       3,
			Authorizations: authorization.DefaultEndpointAuthorizationsForStandardUserRole(false),
		}

		err = store.RoleService.CreateRole(standardUserRole)
		if err != nil {
			return err
		}

		readOnlyUserRole := &portainer.Role{
			Name:           "Read-only user",
			Description:    "Read-only access of assigned resources in an endpoint",
			Priority:       4,
			Authorizations: authorization.DefaultEndpointAuthorizationsForReadOnlyUserRole(false),
		}

		err = store.RoleService.CreateRole(readOnlyUserRole)
		if err != nil {
			return err
		}
	}

	return nil
}
