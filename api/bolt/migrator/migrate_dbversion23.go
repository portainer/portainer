package migrator

func (m *Migrator) updateSettingsToDBVersion24() error {
	legacySettings, err := m.settingsService.Settings()
	if err != nil {
		return err
	}

	legacySettings.AllowDeviceMappingForRegularUsers = true
	legacySettings.AllowStackManagementForRegularUsers = true
	legacySettings.AllowHostNamespaceForRegularUsers = true

	return m.settingsService.UpdateSettings(legacySettings)
}
