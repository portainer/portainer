package migrator

import (
	portainer "github.com/portainer/portainer/api"
)

func (m *Migrator) updateUsersToDBVersion21() error {
	legacyUsers, err := m.userService.Users()
	if err != nil {
		return err
	}

	for _, user := range legacyUsers {
		user.PortainerAuthorizations = portainer.DefaultPortainerAuthorizations()
		err = m.userService.UpdateUser(user.ID, &user)
		if err != nil {
			return err
		}
	}

	return nil
}
