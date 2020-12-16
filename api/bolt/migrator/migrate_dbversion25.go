package migrator

import (
	"log"
	"strings"
)

func (m *Migrator) updateUsersToDBVersion26() error {
	legacyUsers, err := m.userService.Users()
	if err != nil {
		return err
	}

	for _, user := range legacyUsers {
		oldUsername := user.Username
		newUsername := strings.ToLower(user.Username)
		if newUsername != user.Username {
			user.Username = newUsername
			err = m.userService.UpdateUser(user.ID, &user)
			if err != nil {
				log.Printf("An error occurred when rename user from %s to %s: %s\n", oldUsername, newUsername, err)
				return err
			} else {
				log.Printf("Renamed user from %s to %s\n", oldUsername, newUsername)
			}
		}
	}

	return nil
}
