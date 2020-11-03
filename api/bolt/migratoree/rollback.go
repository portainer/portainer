package migratoree

import (
	"github.com/portainer/portainer/api"
)

// Rollback rolls back the db to portainer CE latest db version
func (m *Migrator) Rollback() error {
	err := m.versionService.StoreDBVersion(portainer.DBVersion)
	if err != nil {
		return err
	}

	err = m.versionService.StoreEdition(portainer.PortainerCE)
	if err != nil {
		return err
	}

	return nil
}
