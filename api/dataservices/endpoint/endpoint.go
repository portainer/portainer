package endpoint

import (
	"sync"
	"time"

	portainer "github.com/portainer/portainer/api"
)

// Service represents a service for managing environment(endpoint) data.
type Service struct {
	connection portainer.Connection
	mu         sync.RWMutex
	idxEdgeID  map[string]portainer.EndpointID
	heartbeats sync.Map
}

// NewService creates a new instance of a service.
func NewService(connection portainer.Connection) (*Service, error) {
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

	db := service.connection.GetDB()

	tx := db.First(&endpoint, `id = ?`, ID)
	if tx.Error != nil {
		return nil, tx.Error
	}

	return endpoint, nil
}

// UpdateEndpoint updates an environment(endpoint).
func (service *Service) UpdateEndpoint(ID portainer.EndpointID, endpoint *portainer.Endpoint) error {
	db := service.connection.GetDB()
	tx := db.Model(&portainer.Endpoint{}).Where("id = ?", ID).UpdateColumns(&endpoint)
	if tx.Error != nil {
		return tx.Error
	}

	return nil
}

// DeleteEndpoint deletes an environment(endpoint).
func (service *Service) DeleteEndpoint(ID portainer.EndpointID) error {
	db := service.connection.GetDB()
	tx := db.Model(&portainer.Endpoint{}).Delete("id = ?", ID)
	if tx.Error != nil {
		return tx.Error
	}

	return nil
}

func (service *Service) endpoints() ([]portainer.Endpoint, error) {
	var endpoints []portainer.Endpoint
	var err error

	db := service.connection.GetDB()
	tx := db.Find(&endpoints)
	if tx.Error != nil {
		return nil, tx.Error
	}

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
	db := service.connection.GetDB()
	tx := db.Model(&portainer.Endpoint{}).Create(&endpoint)
	if tx.Error != nil {
		return tx.Error
	}
	return nil
}
