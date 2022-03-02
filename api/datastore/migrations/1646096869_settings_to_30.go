package migrations

import (
	"github.com/portainer/portainer/api/datastore/migrations/types"
)

func init() {
	migrator.AddMigration(types.Migration{
		Version:   29,
		Timestamp: 1646096869,
		Up:        v29_up_settings_to_30,
		Down:      v29_down_settings_to_30,
		Name:      "settings to 30",
	})
}

// so setting to false and "", is what would happen without this code
// I'm going to bet there's zero point to changing the value inthe DB
// Public for testing
func v29_up_settings_to_30() error {
	legacySettings, err := migrator.store.SettingsService.Settings()
	if err != nil {
		return err
	}

	legacySettings.OAuthSettings.SSO = false
	legacySettings.OAuthSettings.LogoutURI = ""
	return migrator.store.SettingsService.UpdateSettings(legacySettings)
}

func v29_down_settings_to_30() error {
	return nil
}
