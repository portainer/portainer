package bolt

func (m *Migrator) updateSettingsToVersion7() error {
	legacySettings, err := m.SettingsService.Settings()
	if err != nil {
		return err
	}
	legacySettings.DisplayDonationHeader = true

	err = m.SettingsService.StoreSettings(legacySettings)
	if err != nil {
		return err
	}

	return nil
}
