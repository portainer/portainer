package migrator

func (m *Migrator) updateSettingsToVersion7() error {
	legacySettings, err := m.settingsService.Settings()
	if err != nil {
		return err
	}
	legacySettings.DisplayDonationHeader = true

	err = m.settingsService.StoreSettings(legacySettings)
	if err != nil {
		return err
	}

	return nil
}
