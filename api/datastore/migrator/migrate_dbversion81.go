package migrator

import (
	"github.com/rs/zerolog/log"
)

func (m *Migrator) migrateDBVersionToDB81() error {
	if err := m.updateUserThemForDB81(); err != nil {
		return err
	}

	return nil
}

func (m *Migrator) updateUserThemForDB81() error {
	log.Info().Msg("updating existing user theme settings")

	users, err := m.userService.Users()
	if err != nil {
		return err
	}

	for i := range users {
		user := &users[i]
		if user.UserTheme != "" {
			user.ThemeSettings.Color = user.UserTheme
		}

		if err := m.userService.UpdateUser(user.ID, user); err != nil {
			return err
		}
	}

	return nil
}
