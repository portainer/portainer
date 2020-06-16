package stack

import (
	"github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/bolt/errors"
	"github.com/portainer/portainer/api/bolt/internal"

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
	err := internal.CreateBucket(db, BucketName)
	if err != nil {
		return nil, err
	}

	return &Service{
		db: db,
	}, nil
}

// Stack returns a stack object by ID.
func (service *Service) Stack(ID portainer.StackID) (*portainer.Stack, error) {
	var stack portainer.Stack
	identifier := internal.Itob(int(ID))

	err := internal.GetObject(service.db, BucketName, identifier, &stack)
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
				break
			}
		}

		if stack == nil {
			return errors.ErrObjectNotFound
		}

		return nil
	})

	return stack, err
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

	return stacks, err
}

// GetNextIdentifier returns the next identifier for a stack.
func (service *Service) GetNextIdentifier() int {
	return internal.GetNextIdentifier(service.db, BucketName)
}

// CreateStack creates a new stack.
func (service *Service) CreateStack(stack *portainer.Stack) error {
	return service.db.Update(func(tx *bolt.Tx) error {
		bucket := tx.Bucket([]byte(BucketName))

		// We manually manage sequences for stacks
		err := bucket.SetSequence(uint64(stack.ID))
		if err != nil {
			return err
		}

		data, err := internal.MarshalObject(stack)
		if err != nil {
			return err
		}

		return bucket.Put(internal.Itob(int(stack.ID)), data)
	})
}

// UpdateStack updates a stack.
func (service *Service) UpdateStack(ID portainer.StackID, stack *portainer.Stack) error {
	identifier := internal.Itob(int(ID))
	return internal.UpdateObject(service.db, BucketName, identifier, stack)
}

// DeleteStack deletes a stack.
func (service *Service) DeleteStack(ID portainer.StackID) error {
	identifier := internal.Itob(int(ID))
	return internal.DeleteObject(service.db, BucketName, identifier)
}
