package migrator

func (m *Migrator) updateSettingsToDBVersion15() error {
	legacySettings, err := m.settingsService.Settings()
	if err != nil {
		return err
	}

	legacySettings.EnableHostManagementFeatures = false
	return m.settingsService.UpdateSettings(legacySettings)
}
