package migrator

func (m *Migrator) migrateDBVersionToDB30() error {
	migrateLog.Info("- updating legacy settings")
	if err := m.MigrateSettingsToDB30(); err != nil {
		return err
	}

	return nil
}

// so setting to false and "", is what would happen without this code
// I'm going to bet there's zero point to changing the value inthe DB
// Public for testing
func (m *Migrator) MigrateSettingsToDB30() error {
	legacySettings, err := m.settingsService.Settings()
	if err != nil {
		return err
	}

	legacySettings.OAuthSettings.SSO = false
	legacySettings.OAuthSettings.LogoutURI = ""
	return m.settingsService.UpdateSettings(legacySettings)
}
