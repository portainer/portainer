package bolt

import "github.com/portainer/portainer"

func (m *Migrator) updateSettingsToVersion7() error {
	legacySettings, err := m.SettingsService.Settings()
	if err != nil {
		return err
	}
	legacySettings.StackTemplatesURL = portainer.DefaultStackTemplatesURL

	err = m.SettingsService.StoreSettings(legacySettings)
	if err != nil {
		return err
	}

	return nil
}
