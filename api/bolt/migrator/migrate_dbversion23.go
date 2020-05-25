package migrator

import portainer "github.com/portainer/portainer/api"

func (m *Migrator) updateSettingsToDB24() error {
	legacySettings, err := m.settingsService.Settings()
	if err != nil {
		return err
	}

	if legacySettings.TemplatesURL == "" {
		legacySettings.TemplatesURL = portainer.DefaultTemplatesURL

		return m.settingsService.UpdateSettings(legacySettings)
	}

	return nil
}
