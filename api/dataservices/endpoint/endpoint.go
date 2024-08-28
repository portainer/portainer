package endpoint

import (
	"sync"
	"time"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"

	"github.com/rs/zerolog/log"
)

// BucketName represents the name of the bucket where this service stores data.
const BucketName = "endpoints"

// Service represents a service for managing environment(endpoint) data.
type Service struct {
	connection portainer.Connection
	mu         sync.RWMutex
	idxEdgeID  map[string]portainer.EndpointID
	heartbeats sync.Map
}

func (service *Service) BucketName() string {
	return BucketName
}

// NewService creates a new instance of a service.
func NewService(connection portainer.Connection) (*Service, error) {
	err := connection.SetServiceName(BucketName)
	if err != nil {
		return nil, err
	}

	s := &Service{
		connection: connection,
		idxEdgeID:  make(map[string]portainer.EndpointID),
	}

	es, err := s.endpoints()
	if err != nil {
		return nil, err
	}

	for _, e := range es {
		if len(e.EdgeID) > 0 {
			s.idxEdgeID[e.EdgeID] = e.ID
		}

		s.heartbeats.Store(e.ID, e.LastCheckInDate)
	}

	return s, nil
}

func (service *Service) Tx(tx portainer.Transaction) ServiceTx {
	return ServiceTx{
		service: service,
		tx:      tx,
	}
}

// Endpoint returns an environment(endpoint) by ID.
func (service *Service) Endpoint(ID portainer.EndpointID) (*portainer.Endpoint, error) {
	var endpoint *portainer.Endpoint
	var err error

	err = service.connection.ViewTx(func(tx portainer.Transaction) error {
		endpoint, err = service.Tx(tx).Endpoint(ID)
		return err
	})
	if err != nil {
		return nil, err
	}

	endpoint.LastCheckInDate, _ = service.Heartbeat(ID)

	return endpoint, nil
}

// UpdateEndpoint updates an environment(endpoint).
func (service *Service) UpdateEndpoint(ID portainer.EndpointID, endpoint *portainer.Endpoint) error {
	return service.connection.UpdateTx(func(tx portainer.Transaction) error {
		return service.Tx(tx).UpdateEndpoint(ID, endpoint)
	})
}

// DeleteEndpoint deletes an environment(endpoint).
func (service *Service) DeleteEndpoint(ID portainer.EndpointID) error {
	return service.connection.UpdateTx(func(tx portainer.Transaction) error {
		return service.Tx(tx).DeleteEndpoint(ID)
	})
}

func (service *Service) endpoints() ([]portainer.Endpoint, error) {
	var endpoints []portainer.Endpoint
	var err error

	err = service.connection.ViewTx(func(tx portainer.Transaction) error {
		endpoints, err = service.Tx(tx).Endpoints()
		return err
	})

	return endpoints, err
}

// Endpoints return an array containing all the environments(endpoints).
func (service *Service) Endpoints() ([]portainer.Endpoint, error) {
	endpoints, err := service.endpoints()
	if err != nil {
		return nil, err
	}

	for i, e := range endpoints {
		t, _ := service.Heartbeat(e.ID)
		endpoints[i].LastCheckInDate = t
	}

	return endpoints, nil
}

// EndpointIDByEdgeID returns the EndpointID from the given EdgeID using an in-memory index
func (service *Service) EndpointIDByEdgeID(edgeID string) (portainer.EndpointID, bool) {
	service.mu.RLock()
	endpointID, ok := service.idxEdgeID[edgeID]
	service.mu.RUnlock()

	return endpointID, ok
}

func (service *Service) Heartbeat(endpointID portainer.EndpointID) (int64, bool) {
	if t, ok := service.heartbeats.Load(endpointID); ok {
		return t.(int64), true
	}

	return 0, false
}

func (service *Service) UpdateHeartbeat(endpointID portainer.EndpointID) {
	service.heartbeats.Store(endpointID, time.Now().Unix())
}

// CreateEndpoint assign an ID to a new environment(endpoint) and saves it.
func (service *Service) Create(endpoint *portainer.Endpoint) error {
	return service.connection.UpdateTx(func(tx portainer.Transaction) error {
		return service.Tx(tx).Create(endpoint)
	})
}

func (service *Service) EndpointsByTeamID(teamID portainer.TeamID) ([]portainer.Endpoint, error) {
	var endpoints = make([]portainer.Endpoint, 0)

	return endpoints, service.connection.GetAll(
		BucketName,
		&portainer.Endpoint{},
		dataservices.FilterFn(&endpoints, func(e portainer.Endpoint) bool {
			for t := range e.TeamAccessPolicies {
				if t == teamID {
					return true
				}
			}

			return false
		}),
	)
}

// GetNextIdentifier returns the next identifier for an environment(endpoint).
func (service *Service) GetNextIdentifier() int {
	var identifier int

	if err := service.connection.UpdateTx(func(tx portainer.Transaction) error {
		identifier = service.Tx(tx).GetNextIdentifier()

		return nil
	}); err != nil {
		log.Error().Err(err).Str("bucket", BucketName).Msg("could not get the next identifier")
	}

	return identifier
}
