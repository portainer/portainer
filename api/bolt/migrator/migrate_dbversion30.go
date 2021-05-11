package migrator

func (m *Migrator) updateSettingsToDB31() error {
	legacySettings, err := m.settingsService.Settings()
	if err != nil {
		return err
	}
	legacySettings.OAuthSettings.SSO = false
	legacySettings.OAuthSettings.LogoutURI = ""
	return m.settingsService.UpdateSettings(legacySettings)
}
