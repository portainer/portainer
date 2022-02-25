package migrations

import (
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/datastore/migrations/types"
)

func init() {
	migrator.AddMigration(types.Migration{
		Version:   18,
		Timestamp: 1645677508,
		Up:        v18_up_settings_to_db_19,
		Down:      v18_down_settings_to_db_19,
		Name:      "settings to db 19",
	})
}

func v18_up_settings_to_db_19() error {
	legacySettings, err := migrator.store.SettingsService.Settings()
	if err != nil {
		return err
	}

	if legacySettings.EdgeAgentCheckinInterval == 0 {
		legacySettings.EdgeAgentCheckinInterval = portainer.DefaultEdgeAgentCheckinIntervalInSeconds
	}

	return migrator.store.SettingsService.UpdateSettings(legacySettings)
}

func v18_down_settings_to_db_19() error {
	return nil
}
