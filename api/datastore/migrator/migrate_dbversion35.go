package migrator

import (
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/internal/authorization"

	"github.com/rs/zerolog/log"
)

func (m *Migrator) migrateDBVersionToDB36() error {
	log.Info().Msg("updating user authorizations")

	return m.migrateUsersToDB36()
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
