package migrator

import "github.com/portainer/portainer"

func (m *Migrator) updateSettingsToDBVersion25() error {
	legacySettings, err := m.settingsService.Settings()
	if err != nil {
		return err
	}

	legacySettings.UserSessionTimeout = portainer.DefaultUserSessionTimeout

	legacySettings.AllowContainerCapabilitiesForRegularUsers = true

	return m.settingsService.UpdateSettings(legacySettings)
}
