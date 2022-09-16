package migrator

import "github.com/rs/zerolog/log"

func (m *Migrator) migrateDBVersionToDB30() error {
	log.Info().Msg("updating legacy settings")

	return m.MigrateSettingsToDB30()
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
