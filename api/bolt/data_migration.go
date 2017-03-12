package bolt

import (
	"github.com/boltdb/bolt"
	"github.com/portainer/portainer"
)

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
		err := m.updateAdminUser()
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

func (m *Migrator) updateAdminUser() error {
	u, err := m.UserService.UserByUsername("admin")
	if err == nil {
		admin := &portainer.User{
			Username: "admin",
			Password: u.Password,
			Role:     portainer.AdministratorRole,
		}
		err = m.UserService.CreateUser(admin)
		if err != nil {
			return err
		}
		err = m.removeLegacyAdminUser()
		if err != nil {
			return err
		}
	} else if err != nil && err != portainer.ErrUserNotFound {
		return err
	}
	return nil
}

func (m *Migrator) removeLegacyAdminUser() error {
	return m.store.db.Update(func(tx *bolt.Tx) error {
		bucket := tx.Bucket([]byte(userBucketName))
		err := bucket.Delete([]byte("admin"))
		if err != nil {
			return err
		}
		return nil
	})
}
