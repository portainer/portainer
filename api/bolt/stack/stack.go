package stack

import (
	"github.com/portainer/portainer"
	"github.com/portainer/portainer/bolt/internal"

	"github.com/boltdb/bolt"
)

const (
	// BucketName represents the name of the bucket where this service stores data.
	BucketName = "stacks"
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

// Stack returns a stack object by ID.
func (service *Service) Stack(ID portainer.StackID) (*portainer.Stack, error) {
	var data []byte
	err := service.db.View(func(tx *bolt.Tx) error {
		bucket := tx.Bucket([]byte(BucketName))
		value := bucket.Get(internal.Itob(int(ID)))
		if value == nil {
			return portainer.ErrStackNotFound
		}

		data = make([]byte, len(value))
		copy(data, value)
		return nil
	})
	if err != nil {
		return nil, err
	}

	var stack portainer.Stack
	err = internal.UnmarshalObject(data, &stack)
	if err != nil {
		return nil, err
	}
	return &stack, nil
}

// StackByName returns a stack object by name.
func (service *Service) StackByName(name string) (*portainer.Stack, error) {
	var stack *portainer.Stack

	err := service.db.View(func(tx *bolt.Tx) error {
		bucket := tx.Bucket([]byte(BucketName))
		cursor := bucket.Cursor()
		for k, v := cursor.First(); k != nil; k, v = cursor.Next() {
			var t portainer.Stack
			err := internal.UnmarshalObject(v, &t)
			if err != nil {
				return err
			}
			if t.Name == name {
				stack = &t
			}
		}

		if stack == nil {
			return portainer.ErrStackNotFound
		}
		return nil
	})
	if err != nil {
		return nil, err
	}
	return stack, nil
}

// Stacks returns an array containing all the stacks.
func (service *Service) Stacks() ([]portainer.Stack, error) {
	var stacks = make([]portainer.Stack, 0)
	err := service.db.View(func(tx *bolt.Tx) error {
		bucket := tx.Bucket([]byte(BucketName))

		cursor := bucket.Cursor()
		for k, v := cursor.First(); k != nil; k, v = cursor.Next() {
			var stack portainer.Stack
			err := internal.UnmarshalObject(v, &stack)
			if err != nil {
				return err
			}
			stacks = append(stacks, stack)
		}

		return nil
	})
	if err != nil {
		return nil, err
	}

	return stacks, nil
}

// GetNextIdentifier returns the current bucket identifier incremented by 1.
func (service *Service) GetNextIdentifier() int {
	var identifier int

	service.db.View(func(tx *bolt.Tx) error {
		bucket := tx.Bucket([]byte(BucketName))
		id := bucket.Sequence()
		identifier = int(id)
		return nil
	})

	identifier++
	return identifier
}

// CreateStack creates a new stack.
func (service *Service) CreateStack(stack *portainer.Stack) error {
	return service.db.Update(func(tx *bolt.Tx) error {
		bucket := tx.Bucket([]byte(BucketName))
		err := bucket.SetSequence(uint64(stack.ID))
		if err != nil {
			return err
		}

		data, err := internal.MarshalObject(stack)
		if err != nil {
			return err
		}

		err = bucket.Put(internal.Itob(int(stack.ID)), data)
		if err != nil {
			return err
		}
		return nil
	})
}

// UpdateStack updates an stack.
func (service *Service) UpdateStack(ID portainer.StackID, stack *portainer.Stack) error {
	data, err := internal.MarshalObject(stack)
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

// DeleteStack deletes an stack.
func (service *Service) DeleteStack(ID portainer.StackID) error {
	return service.db.Update(func(tx *bolt.Tx) error {
		bucket := tx.Bucket([]byte(BucketName))
		err := bucket.Delete(internal.Itob(int(ID)))
		if err != nil {
			return err
		}
		return nil
	})
}
