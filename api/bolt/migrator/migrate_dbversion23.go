package migrator

import portainer "github.com/portainer/portainer/api"

func (m *Migrator) updateSettingsToDB24() error {
	legacySettings, err := m.settingsService.Settings()
	if err != nil {
		return err
	}
	updateSettings := false
	if legacySettings.TemplatesURL == "" {
		legacySettings.TemplatesURL = portainer.DefaultTemplatesURL
		updateSettings = true
	}

	if legacySettings.UserSessionTimeout == "" {
		legacySettings.UserSessionTimeout = portainer.DefaultUserSessionTimeout
		updateSettings = true
	}

	if updateSettings {
		return m.settingsService.UpdateSettings(legacySettings)
	}

	return nil
}
