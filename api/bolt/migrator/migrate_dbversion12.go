package migrator

import "github.com/portainer/portainer"

func (m *Migrator) updateSettingsToVersion13() error {
	legacySettings, err := m.settingsService.Settings()
	if err != nil {
		return err
	}

	legacySettings.AuthenticationMethod = portainer.AuthenticationInternal
	legacySettings.LDAPSettings = portainer.LDAPSettings{
		TLSConfig: portainer.TLSConfiguration{},
		GroupSearchSettings: []portainer.LDAPGroupSearchSettings{
			portainer.LDAPGroupSearchSettings{},
		},
	}

	return m.settingsService.UpdateSettings(legacySettings)
}
