package migrator

import (
	"github.com/pkg/errors"
)

func (m *Migrator) migrateDBVersionToDB50() error {
	return m.migratePasswordLengthSettings()
}

func (m *Migrator) migratePasswordLengthSettings() error {
	migrateLog.Info("Updating required password length")
	s, err := m.settingsService.Settings()
	if err != nil {
		return errors.Wrap(err, "unable to retrieve settings")
	}

	s.InternalAuthSettings.RequiredPasswordLength = 12
	return m.settingsService.UpdateSettings(s)
}
