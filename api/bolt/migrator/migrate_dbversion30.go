package migrator

func (m *Migrator) migrateDBVersionTo30() error {
	if err := m.migrateSettings(); err != nil {
		return err
	}
	return nil
}

func (m *Migrator) migrateSettings() error {
	legacySettings, err := m.settingsService.Settings()
	if err != nil {
		return err
	}
	legacySettings.OAuthSettings.SSO = false
	legacySettings.OAuthSettings.LogoutURI = ""
	return m.settingsService.UpdateSettings(legacySettings)
}
