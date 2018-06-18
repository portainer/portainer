package migrator

import "github.com/portainer/portainer"

func (m *Migrator) updateSettingsToDBVersion3() error {
	legacySettings, err := m.settingsService.Settings()
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

	err = m.settingsService.StoreSettings(legacySettings)
	if err != nil {
		return err
	}

	return nil
}
