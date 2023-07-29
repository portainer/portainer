package datastore

import (
	"os"

	portainer "github.com/portainer/portainer/api"
)

// Init creates the default data set.
func (store *Store) Init() error {
	err := store.checkOrCreateDefaultSettings()
	if err != nil {
		return err
	}

	err = store.checkOrCreateDefaultSSLSettings()
	if err != nil {
		return err
	}

	return store.checkOrCreateDefaultData()
}

func (store *Store) checkOrCreateDefaultSettings() error {
	isDDExtention := false
	if _, ok := os.LookupEnv("DOCKER_EXTENSION"); ok {
		isDDExtention = true
	}

	// TODO: these need to also be applied when importing
	settings, err := store.SettingsService.Settings()
	if store.IsErrObjectNotFound(err) {
		defaultSettings := &portainer.Settings{
			EnableTelemetry:      false,
			AuthenticationMethod: portainer.AuthenticationInternal,
			BlackListedLabels:    make([]portainer.Pair, 0),
			InternalAuthSettings: portainer.InternalAuthSettings{
				RequiredPasswordLength: 12,
			},
			LDAPSettings: portainer.LDAPSettings{
				AnonymousMode:   true,
				AutoCreateUsers: true,
				TLSConfig:       portainer.TLSConfiguration{},
				SearchSettings: []portainer.LDAPSearchSettings{
					{},
				},
				GroupSearchSettings: []portainer.LDAPGroupSearchSettings{
					{},
				},
			},
			OAuthSettings: portainer.OAuthSettings{
				SSO: true,
			},
			SnapshotInterval:         portainer.DefaultSnapshotInterval,
			EdgeAgentCheckinInterval: portainer.DefaultEdgeAgentCheckinIntervalInSeconds,
			TemplatesURL:             portainer.DefaultTemplatesURL,
			HelmRepositoryURL:        portainer.DefaultHelmRepositoryURL,
			UserSessionTimeout:       portainer.DefaultUserSessionTimeout,
			KubeconfigExpiry:         portainer.DefaultKubeconfigExpiry,
			KubectlShellImage:        portainer.DefaultKubectlShellImage,

			IsDockerDesktopExtension: isDDExtention,
		}

		return store.SettingsService.UpdateSettings(defaultSettings)
	}
	if err != nil {
		return err
	}

	if settings.UserSessionTimeout == "" {
		settings.UserSessionTimeout = portainer.DefaultUserSessionTimeout
		return store.Settings().UpdateSettings(settings)
	}

	return nil
}

func (store *Store) checkOrCreateDefaultSSLSettings() error {
	_, err := store.SSLSettings().Settings()
	if store.IsErrObjectNotFound(err) {
		defaultSSLSettings := &portainer.SSLSettings{
			HTTPEnabled: true,
		}

		return store.SSLSettings().UpdateSettings(defaultSSLSettings)
	}

	return err
}

func (store *Store) checkOrCreateDefaultData() error {
	groups, err := store.EndpointGroupService.ReadAll()
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
