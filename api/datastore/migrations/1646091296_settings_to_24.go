package migrations

import (
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/datastore/migrations/types"
	"github.com/sirupsen/logrus"
)

func init() {
	migrator.AddMigration(types.Migration{
		Version:   23,
		Timestamp: 1646091296,
		Up:        v23_up_settings_to_24,
		Down:      v23_down_settings_to_24,
		Name:      "settings to 25",
	})
}

func v23_up_settings_to_24() error {
	logrus.Info("Updating settings")

	legacySettings, err := migrator.store.SettingsService.Settings()
	if err != nil {
		return err
	}

	if legacySettings.TemplatesURL == "" {
		legacySettings.TemplatesURL = portainer.DefaultTemplatesURL
	}

	legacySettings.UserSessionTimeout = portainer.DefaultUserSessionTimeout
	legacySettings.EnableTelemetry = true

	legacySettings.AllowContainerCapabilitiesForRegularUsers = true

	return migrator.store.SettingsService.UpdateSettings(legacySettings)
}

func v23_down_settings_to_24() error {
	return nil
}
