package migrations

import (
	"github.com/portainer/portainer/api/datastore/migrations/types"
)

func init() {
	migrator.AddMigration(types.Migration{
		Version:   19,
		Timestamp: 1645737700,
		Up:        v19_up_settings_to_db_20,
		Down:      v19_down_settings_to_db_20,
		Name:      "settings to db 20",
	})
}

func v19_up_settings_to_db_20() error {
	legacySettings, err := migrator.store.SettingsService.Settings()
	if err != nil {
		return err
	}

	legacySettings.AllowVolumeBrowserForRegularUsers = false

	return migrator.store.SettingsService.UpdateSettings(legacySettings)
}

func v19_down_settings_to_db_20() error {
	return nil
}
