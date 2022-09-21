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

	if legacySettings.TemplatesURL == "" {
		legacySettings.TemplatesURL = portainer.DefaultTemplatesURL
	}

	legacySettings.UserSessionTimeout = portainer.DefaultUserSessionTimeout
	legacySettings.EnableTelemetry = true

	legacySettings.AllowContainerCapabilitiesForRegularUsers = true

	return m.settingsService.UpdateSettings(legacySettings)
}
