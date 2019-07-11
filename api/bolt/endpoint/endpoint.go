package endpoint

import (
	"strings"

	"github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/bolt/internal"
	"github.com/portainer/portainer/api/utils"

	"github.com/boltdb/bolt"
)

const (
	// BucketName represents the name of the bucket where this service stores data.
	BucketName = "endpoints"
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

// Endpoint returns an endpoint by ID.
func (service *Service) Endpoint(ID portainer.EndpointID) (*portainer.Endpoint, error) {
	var endpoint portainer.Endpoint
	identifier := internal.Itob(int(ID))

	err := internal.GetObject(service.db, BucketName, identifier, &endpoint)
	if err != nil {
		return nil, err
	}

	return &endpoint, nil
}

// UpdateEndpoint updates an endpoint.
func (service *Service) UpdateEndpoint(ID portainer.EndpointID, endpoint *portainer.Endpoint) error {
	identifier := internal.Itob(int(ID))
	return internal.UpdateObject(service.db, BucketName, identifier, endpoint)
}

// DeleteEndpoint deletes an endpoint.
func (service *Service) DeleteEndpoint(ID portainer.EndpointID) error {
	identifier := internal.Itob(int(ID))
	return internal.DeleteObject(service.db, BucketName, identifier)
}

// EndpointCount returns the total count of endpoints.
func (service *Service) EndpointCount() (int, error) {
	endpointCount := 0

	err := service.db.View(func(tx *bolt.Tx) error {
		bucket := tx.Bucket([]byte(BucketName))
		endpointCount = bucket.Stats().KeyN
		return nil
	})

	return endpointCount, err
}

func matchFilter(endpoint portainer.Endpoint, filters utils.SlicedFilter, restrictedGroupID portainer.EndpointGroupID) bool {
	if restrictedGroupID != -1 && endpoint.GroupID != restrictedGroupID {
		return false
	}

	if utils.StringContainsOneOf(strings.ToLower(endpoint.Name), filters) {
		return true
	} else if utils.StringContainsOneOf(strings.ToLower(endpoint.URL), filters) {
		return true
	}

	if endpoint.Status == portainer.EndpointStatusUp && utils.StringContainsOneOf("up", filters) {
		return true
	} else if endpoint.Status == portainer.EndpointStatusDown && utils.StringContainsOneOf("down", filters) {
		return true
	}

	for _, tag := range endpoint.Tags {
		if utils.StringContainsOneOf(strings.ToLower(tag), filters) {
			return true
		}
	}

	return false
}

// EndpointsFiltered return an array containing all the endpoints matching
// the specified filter. The search is performed on the endpoint name, URL, status
// and tags. It also aggregates any endpoint that is part of the specified matching endpoint
// groups.
func (service *Service) EndpointsFiltered(filter utils.SlicedFilter, matchingGroups []portainer.EndpointGroup, restrictedGroupID portainer.EndpointGroupID) ([]portainer.Endpoint, error) {
	var endpoints = make([]portainer.Endpoint, 0)

	err := service.db.View(func(tx *bolt.Tx) error {
		bucket := tx.Bucket([]byte(BucketName))

		cursor := bucket.Cursor()
		for k, v := cursor.First(); k != nil; k, v = cursor.Next() {
			var endpoint portainer.Endpoint
			err := internal.UnmarshalObject(v, &endpoint)
			if err != nil {
				return err
			}

			if matchFilter(endpoint, filter, restrictedGroupID) {
				endpoints = append(endpoints, endpoint)
				continue
			}

			for _, group := range matchingGroups {
				if group.ID == endpoint.GroupID {
					endpoints = append(endpoints, endpoint)
					break
				}
			}
		}

		return nil
	})

	return endpoints, err
}

// EndpointsPaginated return an array containing a specific amount of endpoints
// based on the specified pagination parameters.
func (service *Service) EndpointsPaginated(pos, limit int) ([]portainer.Endpoint, error) {
	var endpoints = make([]portainer.Endpoint, 0)

	err := service.db.View(func(tx *bolt.Tx) error {
		bucket := tx.Bucket([]byte(BucketName))

		cursor := bucket.Cursor()
		idx := 0
		for k, v := cursor.First(); k != nil; k, v = cursor.Next() {

			if limit == 0 || idx >= pos && idx < pos+limit {
				var endpoint portainer.Endpoint
				err := internal.UnmarshalObject(v, &endpoint)
				if err != nil {
					return err
				}
				endpoints = append(endpoints, endpoint)
			}

			idx++
		}

		return nil
	})

	return endpoints, err
}

// Endpoints return an array containing all the endpoints.
func (service *Service) Endpoints() ([]portainer.Endpoint, error) {
	var endpoints = make([]portainer.Endpoint, 0)

	err := service.db.View(func(tx *bolt.Tx) error {
		bucket := tx.Bucket([]byte(BucketName))

		cursor := bucket.Cursor()
		for k, v := cursor.First(); k != nil; k, v = cursor.Next() {
			var endpoint portainer.Endpoint
			err := internal.UnmarshalObject(v, &endpoint)
			if err != nil {
				return err
			}
			endpoints = append(endpoints, endpoint)
		}

		return nil
	})

	return endpoints, err
}

// CreateEndpoint assign an ID to a new endpoint and saves it.
func (service *Service) CreateEndpoint(endpoint *portainer.Endpoint) error {
	return service.db.Update(func(tx *bolt.Tx) error {
		bucket := tx.Bucket([]byte(BucketName))

		// We manually manage sequences for endpoints
		err := bucket.SetSequence(uint64(endpoint.ID))
		if err != nil {
			return err
		}

		data, err := internal.MarshalObject(endpoint)
		if err != nil {
			return err
		}

		return bucket.Put(internal.Itob(int(endpoint.ID)), data)
	})
}

// GetNextIdentifier returns the next identifier for an endpoint.
func (service *Service) GetNextIdentifier() int {
	return internal.GetNextIdentifier(service.db, BucketName)
}

// Synchronize creates, updates and deletes endpoints inside a single transaction.
func (service *Service) Synchronize(toCreate, toUpdate, toDelete []*portainer.Endpoint) error {
	return service.db.Update(func(tx *bolt.Tx) error {
		bucket := tx.Bucket([]byte(BucketName))

		for _, endpoint := range toCreate {
			id, _ := bucket.NextSequence()
			endpoint.ID = portainer.EndpointID(id)

			data, err := internal.MarshalObject(endpoint)
			if err != nil {
				return err
			}

			err = bucket.Put(internal.Itob(int(endpoint.ID)), data)
			if err != nil {
				return err
			}
		}

		for _, endpoint := range toUpdate {
			data, err := internal.MarshalObject(endpoint)
			if err != nil {
				return err
			}

			err = bucket.Put(internal.Itob(int(endpoint.ID)), data)
			if err != nil {
				return err
			}
		}

		for _, endpoint := range toDelete {
			err := bucket.Delete(internal.Itob(int(endpoint.ID)))
			if err != nil {
				return err
			}
		}

		return nil
	})
}
