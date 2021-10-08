package migrator

func (m *Migrator) updateSettingsToDBVersion16() error {
	legacySettings, err := m.settingsService.Settings()
	if err != nil {
		return err
	}

	if legacySettings.SnapshotInterval == "" {
		legacySettings.SnapshotInterval = "5m"
	}

	return m.settingsService.UpdateSettings(legacySettings)
}
