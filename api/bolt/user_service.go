package bolt

import (
	"github.com/portainer/portainer"
	"github.com/portainer/portainer/bolt/internal"

	"github.com/boltdb/bolt"
)

// UserService represents a service for managing users.
type UserService struct {
	store *Store
}

// User returns a user by ID
func (service *UserService) User(ID portainer.UserID) (*portainer.User, error) {
	var data []byte
	err := service.store.db.View(func(tx *bolt.Tx) error {
		bucket := tx.Bucket([]byte(userBucketName))
		value := bucket.Get(internal.Itob(int(ID)))
		if value == nil {
			return portainer.ErrUserNotFound
		}

		data = make([]byte, len(value))
		copy(data, value)
		return nil
	})
	if err != nil {
		return nil, err
	}

	var user portainer.User
	err = internal.UnmarshalUser(data, &user)
	if err != nil {
		return nil, err
	}
	return &user, nil
}

// UserByUsername returns a user by username.
func (service *UserService) UserByUsername(username string) (*portainer.User, error) {
	var user *portainer.User

	err := service.store.db.View(func(tx *bolt.Tx) error {
		bucket := tx.Bucket([]byte(userBucketName))
		cursor := bucket.Cursor()
		for k, v := cursor.First(); k != nil; k, v = cursor.Next() {
			var u portainer.User
			err := internal.UnmarshalUser(v, &u)
			if err != nil {
				return err
			}
			if u.Username == username {
				user = &u
			}
		}

		if user == nil {
			return portainer.ErrUserNotFound
		}
		return nil
	})
	if err != nil {
		return nil, err
	}
	return user, nil
}

// Users return an array containing all the users.
func (service *UserService) Users() ([]portainer.User, error) {
	var users = make([]portainer.User, 0)
	err := service.store.db.View(func(tx *bolt.Tx) error {
		bucket := tx.Bucket([]byte(userBucketName))

		cursor := bucket.Cursor()
		for k, v := cursor.First(); k != nil; k, v = cursor.Next() {
			var user portainer.User
			err := internal.UnmarshalUser(v, &user)
			if err != nil {
				return err
			}
			users = append(users, user)
		}

		return nil
	})
	if err != nil {
		return nil, err
	}

	return users, nil
}

// UsersByRole return an array containing all the users with the specified role.
func (service *UserService) UsersByRole(role portainer.UserRole) ([]portainer.User, error) {
	var users = make([]portainer.User, 0)
	err := service.store.db.View(func(tx *bolt.Tx) error {
		bucket := tx.Bucket([]byte(userBucketName))

		cursor := bucket.Cursor()
		for k, v := cursor.First(); k != nil; k, v = cursor.Next() {
			var user portainer.User
			err := internal.UnmarshalUser(v, &user)
			if err != nil {
				return err
			}
			if user.Role == role {
				users = append(users, user)
			}
		}
		return nil
	})
	if err != nil {
		return nil, err
	}

	return users, nil
}

// UpdateUser saves a user.
func (service *UserService) UpdateUser(ID portainer.UserID, user *portainer.User) error {
	data, err := internal.MarshalUser(user)
	if err != nil {
		return err
	}

	return service.store.db.Update(func(tx *bolt.Tx) error {
		bucket := tx.Bucket([]byte(userBucketName))
		err = bucket.Put(internal.Itob(int(ID)), data)

		if err != nil {
			return err
		}
		return nil
	})
}

// CreateUser creates a new user.
func (service *UserService) CreateUser(user *portainer.User) error {
	return service.store.db.Update(func(tx *bolt.Tx) error {
		bucket := tx.Bucket([]byte(userBucketName))

		id, _ := bucket.NextSequence()
		user.ID = portainer.UserID(id)

		data, err := internal.MarshalUser(user)
		if err != nil {
			return err
		}

		err = bucket.Put(internal.Itob(int(user.ID)), data)
		if err != nil {
			return err
		}
		return nil
	})
}

// DeleteUser deletes a user.
func (service *UserService) DeleteUser(ID portainer.UserID) error {
	return service.store.db.Update(func(tx *bolt.Tx) error {
		bucket := tx.Bucket([]byte(userBucketName))
		err := bucket.Delete(internal.Itob(int(ID)))
		if err != nil {
			return err
		}
		return nil
	})
}
