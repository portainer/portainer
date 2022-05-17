package migrator

import (
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/internal/authorization"
)

func (m *Migrator) migrateDBVersionToDB36() error {
	migrateLog.Info("Updating user authorizations")
	if err := m.migrateUsersToDB36(); err != nil {
		return err
	}

	return nil
}

func (m *Migrator) migrateUsersToDB36() error {
	users, err := m.userService.Users()
	if err != nil {
		return err
	}

	for _, user := range users {
		currentAuthorizations := authorization.DefaultPortainerAuthorizations()
		currentAuthorizations[portainer.OperationPortainerUserListToken] = true
		currentAuthorizations[portainer.OperationPortainerUserCreateToken] = true
		currentAuthorizations[portainer.OperationPortainerUserRevokeToken] = true
		user.PortainerAuthorizations = currentAuthorizations
		err = m.userService.UpdateUser(user.ID, &user)
		if err != nil {
			return err
		}
	}

	return nil
}
