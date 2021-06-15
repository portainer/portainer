package migrator

func (m *Migrator) migrateDBVersionTo30() error {
	if err := migrateSettings(m); err != nil {
		return err
	}
	return nil
}

func migrateSettings(m *Migrator) error {
	legacySettings, err := m.settingsService.Settings()
	if err != nil {
		return err
	}
	legacySettings.OAuthSettings.SSO = false
	legacySettings.OAuthSettings.LogoutURI = ""
	return m.settingsService.UpdateSettings(legacySettings)
}
