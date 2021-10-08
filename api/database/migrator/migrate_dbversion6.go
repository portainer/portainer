package migrator

func (m *Migrator) updateSettingsToVersion7() error {
	legacySettings, err := m.settingsService.Settings()
	if err != nil {
		return err
	}
	legacySettings.DisplayDonationHeader = true

	return m.settingsService.UpdateSettings(legacySettings)
}
