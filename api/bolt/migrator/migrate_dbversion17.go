package migrator

func (m *Migrator) updateSettingsToDBVersion18() error {
	legacySettings, err := m.settingsService.Settings()
	if err != nil {
		return err
	}

	legacySettings.ResourcesArePublicByDefault = false
	return m.settingsService.UpdateSettings(legacySettings)
}
