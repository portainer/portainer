package bolt

import "github.com/portainer/portainer"

type Migrator struct {
	UserService            *UserService
	EndpointService        *EndpointService
	ResourceControlService *ResourceControlService
	VersionService         *VersionService
	CurrentDBVersion       int
	store                  *Store
}

func NewMigrator(store *Store, version int) *Migrator {
	return &Migrator{
		UserService:            store.UserService,
		EndpointService:        store.EndpointService,
		ResourceControlService: store.ResourceControlService,
		VersionService:         store.VersionService,
		CurrentDBVersion:       version,
		store:                  store,
	}
}

func (m *Migrator) Migrate() error {

	// Portainer < 1.12
	if m.CurrentDBVersion == 0 {
		err := m.UpdateAdminUserToDBVersion1()
		if err != nil {
			return err
		}
	}

	// Portainer 1.12.x
	if m.CurrentDBVersion == 1 {
		err := m.UpdateResourceControlsToDBVersion2()
		if err != nil {
			return err
		}
		err = m.UpdateEndpointsToDBVersion2()
		if err != nil {
			return err
		}
	}

	err := m.VersionService.StoreDBVersion(portainer.DBVersion)
	if err != nil {
		return err
	}
	return nil
}
