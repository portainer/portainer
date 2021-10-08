package migrator

func (m *Migrator) updateSettingsToVersion6() error {
	legacySettings, err := m.settingsService.Settings()
	if err != nil {
		return err
	}

	legacySettings.AllowPrivilegedModeForRegularUsers = true
	return m.settingsService.UpdateSettings(legacySettings)
}
