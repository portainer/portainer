package bolt

import "github.com/portainer/portainer"

func (m *Migrator) updateSettingsToVersion3() error {
	legacySettings, err := m.SettingsService.Settings()
	if err != nil {
		return err
	}

	legacySettings.AuthenticationMethod = portainer.AuthenticationInternal
	legacySettings.LDAPSettings = portainer.LDAPSettings{
		TLSConfig: portainer.TLSConfiguration{},
		SearchSettings: []portainer.LDAPSearchSettings{
			portainer.LDAPSearchSettings{},
		},
	}

	err = m.SettingsService.StoreSettings(legacySettings)
	if err != nil {
		return err
	}

	return nil
}
