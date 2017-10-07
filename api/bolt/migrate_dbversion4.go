package bolt

func (m *Migrator) updateSettingsToVersion5() error {
	legacySettings, err := m.SettingsService.Settings()
	if err != nil {
		return err
	}
	legacySettings.AllowBindMountsForRegularUsers = true

	err = m.SettingsService.StoreSettings(legacySettings)
	if err != nil {
		return err
	}

	return nil
}
