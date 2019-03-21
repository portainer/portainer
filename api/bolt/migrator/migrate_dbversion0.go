package migrator

import (
	"github.com/boltdb/bolt"
	"github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/bolt/user"
)

func (m *Migrator) updateAdminUserToDBVersion1() error {
	u, err := m.userService.UserByUsername("admin")
	if err == nil {
		admin := &portainer.User{
			Username: "admin",
			Password: u.Password,
			Role:     portainer.AdministratorRole,
		}
		err = m.userService.CreateUser(admin)
		if err != nil {
			return err
		}
		err = m.removeLegacyAdminUser()
		if err != nil {
			return err
		}
	} else if err != nil && err != portainer.ErrObjectNotFound {
		return err
	}
	return nil
}

func (m *Migrator) removeLegacyAdminUser() error {
	return m.db.Update(func(tx *bolt.Tx) error {
		bucket := tx.Bucket([]byte(user.BucketName))
		return bucket.Delete([]byte("admin"))
	})
}
