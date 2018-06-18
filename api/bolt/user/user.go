package user

import (
	"github.com/portainer/portainer"
	"github.com/portainer/portainer/bolt/internal"

	"github.com/boltdb/bolt"
)

const (
	// BucketName represents the name of the bucket where this service stores data.
	BucketName = "users"
)

// Service represents a service for managing endpoint data.
type Service struct {
	db *bolt.DB
}

// NewService creates a new instance of a service.
func NewService(db *bolt.DB) (*Service, error) {
	err := db.Update(func(tx *bolt.Tx) error {
		_, err := tx.CreateBucketIfNotExists([]byte(BucketName))
		if err != nil {
			return err
		}
		return nil
	})
	if err != nil {
		return nil, err
	}

	return &Service{
		db: db,
	}, nil
}

// User returns a user by ID
func (service *Service) User(ID portainer.UserID) (*portainer.User, error) {
	var data []byte
	err := service.db.View(func(tx *bolt.Tx) error {
		bucket := tx.Bucket([]byte(BucketName))
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
	err = internal.UnmarshalObject(data, &user)
	if err != nil {
		return nil, err
	}
	return &user, nil
}

// UserByUsername returns a user by username.
func (service *Service) UserByUsername(username string) (*portainer.User, error) {
	var user *portainer.User

	err := service.db.View(func(tx *bolt.Tx) error {
		bucket := tx.Bucket([]byte(BucketName))
		cursor := bucket.Cursor()
		for k, v := cursor.First(); k != nil; k, v = cursor.Next() {
			var u portainer.User
			err := internal.UnmarshalObject(v, &u)
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
func (service *Service) Users() ([]portainer.User, error) {
	var users = make([]portainer.User, 0)
	err := service.db.View(func(tx *bolt.Tx) error {
		bucket := tx.Bucket([]byte(BucketName))

		cursor := bucket.Cursor()
		for k, v := cursor.First(); k != nil; k, v = cursor.Next() {
			var user portainer.User
			err := internal.UnmarshalObject(v, &user)
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
func (service *Service) UsersByRole(role portainer.UserRole) ([]portainer.User, error) {
	var users = make([]portainer.User, 0)
	err := service.db.View(func(tx *bolt.Tx) error {
		bucket := tx.Bucket([]byte(BucketName))

		cursor := bucket.Cursor()
		for k, v := cursor.First(); k != nil; k, v = cursor.Next() {
			var user portainer.User
			err := internal.UnmarshalObject(v, &user)
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
func (service *Service) UpdateUser(ID portainer.UserID, user *portainer.User) error {
	data, err := internal.MarshalObject(user)
	if err != nil {
		return err
	}

	return service.db.Update(func(tx *bolt.Tx) error {
		bucket := tx.Bucket([]byte(BucketName))
		err = bucket.Put(internal.Itob(int(ID)), data)

		if err != nil {
			return err
		}
		return nil
	})
}

// CreateUser creates a new user.
func (service *Service) CreateUser(user *portainer.User) error {
	return service.db.Update(func(tx *bolt.Tx) error {
		bucket := tx.Bucket([]byte(BucketName))

		id, _ := bucket.NextSequence()
		user.ID = portainer.UserID(id)

		data, err := internal.MarshalObject(user)
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
func (service *Service) DeleteUser(ID portainer.UserID) error {
	return service.db.Update(func(tx *bolt.Tx) error {
		bucket := tx.Bucket([]byte(BucketName))
		err := bucket.Delete(internal.Itob(int(ID)))
		if err != nil {
			return err
		}
		return nil
	})
}
