package migrator

import "github.com/portainer/portainer"

func (m *Migrator) updateSettingsToVersion13() error {
	legacySettings, err := m.settingsService.Settings()
	if err != nil {
		return err
	}

	legacySettings.LDAPSettings.GroupSearchSettings = []portainer.LDAPGroupSearchSettings{
		portainer.LDAPGroupSearchSettings{},
	}

	return m.settingsService.UpdateSettings(legacySettings)
}
