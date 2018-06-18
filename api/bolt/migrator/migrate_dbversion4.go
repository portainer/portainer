package migrator

func (m *Migrator) updateSettingsToVersion5() error {
	legacySettings, err := m.settingsService.Settings()
	if err != nil {
		return err
	}
	legacySettings.AllowBindMountsForRegularUsers = true

	err = m.settingsService.StoreSettings(legacySettings)
	if err != nil {
		return err
	}

	return nil
}
