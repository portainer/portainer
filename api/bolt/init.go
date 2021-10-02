package bolt

import (
	"github.com/gofrs/uuid"
	portainer "github.com/portainer/portainer/api"
)

// Init creates the default data set.
func (store *Store) Init() error {
	instanceID, err := store.VersionService.InstanceID()
	if store.IsErrObjectNotFound(err) {
		uid, err := uuid.NewV4()
		if err != nil {
			return err
		}

		instanceID = uid.String()
		err = store.VersionService.StoreInstanceID(instanceID)
		if err != nil {
			return err
		}
	} else if err != nil {
		return err
	}

	_, err = store.SettingsService.Settings()
	if store.IsErrObjectNotFound(err) {
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
			OAuthSettings: portainer.OAuthSettings{},

			EdgeAgentCheckinInterval: portainer.DefaultEdgeAgentCheckinIntervalInSeconds,
			TemplatesURL:             portainer.DefaultTemplatesURL,
			HelmRepositoryURL:        portainer.DefaultHelmRepositoryURL,
			UserSessionTimeout:       portainer.DefaultUserSessionTimeout,
			KubeconfigExpiry:         portainer.DefaultKubeconfigExpiry,
			KubectlShellImage:        portainer.DefaultKubectlShellImage,
		}

		err = store.SettingsService.UpdateSettings(defaultSettings)
		if err != nil {
			return err
		}
	} else if err != nil {
		return err
	}

	_, err = store.SSLSettings().Settings()
	if err != nil {
		if !store.IsErrObjectNotFound(err) {
			return err
		}

		defaultSSLSettings := &portainer.SSLSettings{
			HTTPEnabled: true,
		}

		err = store.SSLSettings().UpdateSettings(defaultSSLSettings)
		if err != nil {
			return err
		}
	}

	groups, err := store.EndpointGroupService.EndpointGroups()
	if err != nil {
		return err
	}

	if len(groups) == 0 {
		unassignedGroup := &portainer.EndpointGroup{
			Name:               "Unassigned",
			Description:        "Unassigned environments",
			Labels:             []portainer.Pair{},
			UserAccessPolicies: portainer.UserAccessPolicies{},
			TeamAccessPolicies: portainer.TeamAccessPolicies{},
			TagIDs:             []portainer.TagID{},
		}

		err = store.EndpointGroupService.Create(unassignedGroup)
		if err != nil {
			return err
		}
	}

	return nil
}
