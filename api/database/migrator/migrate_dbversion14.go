package migrator

func (m *Migrator) updateSettingsToDBVersion15() error {
	legacySettings, err := m.settingsService.Settings()
	if err != nil {
		return err
	}

	legacySettings.EnableHostManagementFeatures = false
	return m.settingsService.UpdateSettings(legacySettings)
}

func (m *Migrator) updateTemplatesToVersion15() error {
	// Removed with the entire template management layer, part of https://github.com/portainer/portainer/issues/3707
	return nil
}
