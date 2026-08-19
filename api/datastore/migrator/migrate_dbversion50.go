package migrator

import (
	"github.com/pkg/errors"
	"github.com/rs/zerolog/log"
)

func (m *Migrator) migrateDBVersionToDB50() error {
	return m.migratePasswordLengthSettings()
}

func (m *Migrator) migratePasswordLengthSettings() error {
	log.Info().Msg("updating required password length")

	s, err := m.settingsService.Settings()
	if err != nil {
		return errors.Wrap(err, "unable to retrieve settings")
	}

	s.InternalAuthSettings.RequiredPasswordLength = 12
	return m.settingsService.UpdateSettings(s)
}
