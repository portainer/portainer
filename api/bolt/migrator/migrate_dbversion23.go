package migrator

func (m *Migrator) updateSettingsToDB24() error {
	legacySettings, err := m.settingsService.Settings()
	if err != nil {
		return err
	}

	legacySettings.AllowHostNamespaceForRegularUsers = true

	return m.settingsService.UpdateSettings(legacySettings)
}
