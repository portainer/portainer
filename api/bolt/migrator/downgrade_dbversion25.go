package migrator

// DowngradeSettingsFrom25 downgrade template settings for portainer v1.2
func (migrator *Migrator) DowngradeSettingsFrom25() error {
	legacySettings, err := migrator.settingsService.Settings()
	if err != nil {
		return err
	}

	legacySettings.TemplatesURL = "https://raw.githubusercontent.com/portainer/templates/master/templates-1.20.0.json"

	err = migrator.settingsService.UpdateSettings(legacySettings)

	return err
}
