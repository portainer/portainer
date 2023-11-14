package migrator

import (
	portainer "github.com/portainer/portainer/api"
	"github.com/rs/zerolog/log"
)

// updateAppTemplatesVersionForDB110 changes the templates URL to be empty if it was never changed
// from the default value (version 2.0 URL)
func (migrator *Migrator) updateAppTemplatesVersionForDB110() error {
	log.Info().Msg("updating app templates url to v3.0")

	version2URL := "https://raw.githubusercontent.com/portainer/templates/master/templates-2.0.json"

	settings, err := migrator.settingsService.Settings()
	if err != nil {
		return err
	}

	if settings.TemplatesURL == version2URL || settings.TemplatesURL == portainer.DefaultTemplatesURL {
		settings.TemplatesURL = ""
	}

	return migrator.settingsService.UpdateSettings(settings)
}
