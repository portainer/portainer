package bolt

func (m *Migrator) updateSettingsToVersion6() error {
	legacySettings, err := m.SettingsService.Settings()
	if err != nil {
		return err
	}
	legacySettings.AllowPrivilegedModeForRegularUsers = true

	err = m.SettingsService.StoreSettings(legacySettings)
	if err != nil {
		return err
	}

	return nil
}
