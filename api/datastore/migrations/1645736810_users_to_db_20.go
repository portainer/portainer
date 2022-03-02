package migrations

import (
	"github.com/portainer/portainer/api/datastore/migrations/types"
)

func init() {
	migrator.AddMigration(types.Migration{
		Version:   19,
		Timestamp: 1645736810,
		Up:        v19_up_users_to_db_20,
		Down:      v19_down_users_to_db_20,
		Name:      "users to db 20",
	})
}

func v19_up_users_to_db_20() error {
	return migrator.store.AuthorizationService.UpdateUsersAuthorizations()
}

func v19_down_users_to_db_20() error {
	return nil
}
