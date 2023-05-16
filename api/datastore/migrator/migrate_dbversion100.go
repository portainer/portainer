package migrator

import (
	"os"

	"github.com/rs/zerolog/log"
)

func (m *Migrator) migrateDockerDesktopExtentionSetting() error {
	log.Info().Msg("updating docker desktop extention flag in settings")

	isDDExtention := false
	if _, ok := os.LookupEnv("DOCKER_EXTENSION"); ok {
		isDDExtention = true
	}

	settings, err := m.settingsService.Settings()
	if err != nil {
		return err
	}

	settings.IsDockerDesktopExtention = isDDExtention
	err = m.settingsService.UpdateSettings(settings)
	if err != nil {
		return err
	}

	return nil
}
