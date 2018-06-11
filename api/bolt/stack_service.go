package bolt

import (
	"github.com/portainer/portainer"
	"github.com/portainer/portainer/bolt/internal"

	"github.com/boltdb/bolt"
)

// StackService represents a service for managing stacks.
type StackService struct {
	store *Store
}

// Stack returns a stack object by ID.
func (service *StackService) Stack(ID portainer.StackID) (*portainer.Stack, error) {
	var data []byte
	err := service.store.db.View(func(tx *bolt.Tx) error {
		bucket := tx.Bucket([]byte(stackBucketName))
		value := bucket.Get([]byte(ID))
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
	err = internal.UnmarshalStack(data, &stack)
	if err != nil {
		return nil, err
	}
	return &stack, nil
}

// StackByName returns a stack object by name.
func (service *StackService) StackByName(name string) (*portainer.Stack, error) {
	var stack *portainer.Stack

	err := service.store.db.View(func(tx *bolt.Tx) error {
		bucket := tx.Bucket([]byte(stackBucketName))
		cursor := bucket.Cursor()
		for k, v := cursor.First(); k != nil; k, v = cursor.Next() {
			var t portainer.Stack
			err := internal.UnmarshalStack(v, &t)
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
func (service *StackService) Stacks() ([]portainer.Stack, error) {
	var stacks = make([]portainer.Stack, 0)
	err := service.store.db.View(func(tx *bolt.Tx) error {
		bucket := tx.Bucket([]byte(stackBucketName))

		cursor := bucket.Cursor()
		for k, v := cursor.First(); k != nil; k, v = cursor.Next() {
			var stack portainer.Stack
			err := internal.UnmarshalStack(v, &stack)
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

// CreateStack creates a new stack.
func (service *StackService) CreateStack(stack *portainer.Stack) error {
	return service.store.db.Update(func(tx *bolt.Tx) error {
		bucket := tx.Bucket([]byte(stackBucketName))

		data, err := internal.MarshalStack(stack)
		if err != nil {
			return err
		}

		err = bucket.Put([]byte(stack.ID), data)
		if err != nil {
			return err
		}
		return nil
	})
}

// UpdateStack updates an stack.
func (service *StackService) UpdateStack(ID portainer.StackID, stack *portainer.Stack) error {
	data, err := internal.MarshalStack(stack)
	if err != nil {
		return err
	}

	return service.store.db.Update(func(tx *bolt.Tx) error {
		bucket := tx.Bucket([]byte(stackBucketName))
		err = bucket.Put([]byte(ID), data)
		if err != nil {
			return err
		}
		return nil
	})
}

// DeleteStack deletes an stack.
func (service *StackService) DeleteStack(ID portainer.StackID) error {
	return service.store.db.Update(func(tx *bolt.Tx) error {
		bucket := tx.Bucket([]byte(stackBucketName))
		err := bucket.Delete([]byte(ID))
		if err != nil {
			return err
		}
		return nil
	})
}
