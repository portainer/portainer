package endpointgroup

import (
	"github.com/portainer/portainer"
	"github.com/portainer/portainer/bolt/internal"

	"github.com/boltdb/bolt"
)

const (
	// BucketName represents the name of the bucket where this service stores data.
	BucketName = "endpoint_groups"
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

// EndpointGroup returns an endpoint group by ID.
func (service *Service) EndpointGroup(ID portainer.EndpointGroupID) (*portainer.EndpointGroup, error) {
	var data []byte
	err := service.db.View(func(tx *bolt.Tx) error {
		bucket := tx.Bucket([]byte(BucketName))
		value := bucket.Get(internal.Itob(int(ID)))
		if value == nil {
			return portainer.ErrEndpointGroupNotFound
		}

		data = make([]byte, len(value))
		copy(data, value)
		return nil
	})
	if err != nil {
		return nil, err
	}

	var endpointGroup portainer.EndpointGroup
	err = internal.UnmarshalObject(data, &endpointGroup)
	if err != nil {
		return nil, err
	}
	return &endpointGroup, nil
}

// EndpointGroups return an array containing all the endpoint groups.
func (service *Service) EndpointGroups() ([]portainer.EndpointGroup, error) {
	var endpointGroups = make([]portainer.EndpointGroup, 0)
	err := service.db.View(func(tx *bolt.Tx) error {
		bucket := tx.Bucket([]byte(BucketName))

		cursor := bucket.Cursor()
		for k, v := cursor.First(); k != nil; k, v = cursor.Next() {
			var endpointGroup portainer.EndpointGroup
			err := internal.UnmarshalObject(v, &endpointGroup)
			if err != nil {
				return err
			}
			endpointGroups = append(endpointGroups, endpointGroup)
		}

		return nil
	})
	if err != nil {
		return nil, err
	}

	return endpointGroups, nil
}

// CreateEndpointGroup assign an ID to a new endpoint group and saves it.
func (service *Service) CreateEndpointGroup(endpointGroup *portainer.EndpointGroup) error {
	return service.db.Update(func(tx *bolt.Tx) error {
		bucket := tx.Bucket([]byte(BucketName))

		id, _ := bucket.NextSequence()
		endpointGroup.ID = portainer.EndpointGroupID(id)

		data, err := internal.MarshalObject(endpointGroup)
		if err != nil {
			return err
		}

		err = bucket.Put(internal.Itob(int(endpointGroup.ID)), data)
		if err != nil {
			return err
		}
		return nil
	})
}

// UpdateEndpointGroup updates an endpoint group.
func (service *Service) UpdateEndpointGroup(ID portainer.EndpointGroupID, endpointGroup *portainer.EndpointGroup) error {
	data, err := internal.MarshalObject(endpointGroup)
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

// DeleteEndpointGroup deletes an endpoint group.
func (service *Service) DeleteEndpointGroup(ID portainer.EndpointGroupID) error {
	return service.db.Update(func(tx *bolt.Tx) error {
		bucket := tx.Bucket([]byte(BucketName))
		err := bucket.Delete(internal.Itob(int(ID)))
		if err != nil {
			return err
		}
		return nil
	})
}
