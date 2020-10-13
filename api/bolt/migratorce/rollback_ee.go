package migratorce

import (
	"github.com/portainer/portainer/api"
)

// RollbackFromEEdbv1 will roll the db back from latest ee version to latest ce version
func (m *Migrator) RollbackFromEEdbv1() error {
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
