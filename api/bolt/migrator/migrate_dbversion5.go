package migrator

func (m *Migrator) updateSettingsToVersion6() error {
	legacySettings, err := m.settingsService.Settings()
	if err != nil {
		return err
	}
	legacySettings.AllowPrivilegedModeForRegularUsers = true

	err = m.settingsService.StoreSettings(legacySettings)
	if err != nil {
		return err
	}

	return nil
}
