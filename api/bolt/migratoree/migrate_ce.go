package migratoree

import (
	"github.com/portainer/portainer/api"
)

// MigrateFromCEdbv25 will migrate the db from latest ce version to latest ee version
func (m *Migrator) MigrateFromCEdbv25() error {
	err := m.versionService.StoreDBVersion(portainer.DBVersionEE)
	if err != nil {
		return err
	}

	err = m.versionService.StoreEdition(portainer.PortainerBE)
	if err != nil {
		return err
	}

	return nil
}
