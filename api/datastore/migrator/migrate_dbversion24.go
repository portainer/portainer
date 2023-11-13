package migrator

import (
	portainer "github.com/portainer/portainer/api"

	"github.com/rs/zerolog/log"
)

func (m *Migrator) updateSettingsToDB25() error {
	log.Info().Msg("updating settings")

	legacySettings, err := m.settingsService.Settings()
	if err != nil {
		return err
	}

	// to keep the same migration functionality as before 2.20.0, we need to set the templates URL to v2
	version2URL := "https://raw.githubusercontent.com/portainer/templates/master/templates-2.0.json"
	if legacySettings.TemplatesURL == "" {
		legacySettings.TemplatesURL = version2URL
	}

	legacySettings.UserSessionTimeout = portainer.DefaultUserSessionTimeout
	legacySettings.EnableTelemetry = true

	legacySettings.AllowContainerCapabilitiesForRegularUsers = true

	return m.settingsService.UpdateSettings(legacySettings)
}
