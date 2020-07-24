package migrator

import (
	"github.com/portainer/portainer/api"
)

func (m *Migrator) updateSettingsToDB25() error {
	legacySettings, err := m.settingsService.Settings()
	if err != nil {
		return err
	}

	if legacySettings.TemplatesURL == "" {
		legacySettings.TemplatesURL = portainer.DefaultTemplatesURL
	}

	legacySettings.UserSessionTimeout = portainer.DefaultUserSessionTimeout

	return m.settingsService.UpdateSettings(legacySettings)
}
