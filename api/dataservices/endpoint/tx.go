package endpoint

import (
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	"github.com/portainer/portainer/api/internal/edge/cache"

	"github.com/rs/zerolog/log"
)

type ServiceTx struct {
	service *Service
	tx      portainer.Transaction
}

func (service ServiceTx) BucketName() string {
	return BucketName
}

// Endpoint returns an environment(endpoint) by ID.
func (service ServiceTx) Endpoint(ID portainer.EndpointID) (*portainer.Endpoint, error) {
	var endpoint portainer.Endpoint

	identifier := service.service.connection.ConvertToKey(int(ID))

	if err := service.tx.GetObject(BucketName, identifier, &endpoint); err != nil {
		return nil, err
	}

	endpoint.LastCheckInDate, _ = service.service.Heartbeat(ID)

	return &endpoint, nil
}

// UpdateEndpoint updates an environment(endpoint).
func (service ServiceTx) UpdateEndpoint(ID portainer.EndpointID, endpoint *portainer.Endpoint) error {
	identifier := service.service.connection.ConvertToKey(int(ID))

	if err := service.tx.UpdateObject(BucketName, identifier, endpoint); err != nil {
		return err
	}

	service.service.mu.Lock()
	if len(endpoint.EdgeID) > 0 {
		service.service.idxEdgeID[endpoint.EdgeID] = ID
	}

	service.service.heartbeats.Store(ID, endpoint.LastCheckInDate)
	service.service.mu.Unlock()

	cache.Del(endpoint.ID)

	return nil
}

// DeleteEndpoint deletes an environment(endpoint).
func (service ServiceTx) DeleteEndpoint(ID portainer.EndpointID) error {
	identifier := service.service.connection.ConvertToKey(int(ID))

	if err := service.tx.DeleteObject(BucketName, identifier); err != nil {
		return err
	}

	service.service.mu.Lock()
	for edgeID, endpointID := range service.service.idxEdgeID {
		if endpointID == ID {
			delete(service.service.idxEdgeID, edgeID)

			break
		}
	}

	service.service.heartbeats.Delete(ID)
	service.service.mu.Unlock()

	cache.Del(ID)

	return nil
}

// Endpoints return an array containing all the environments(endpoints).
func (service ServiceTx) Endpoints() ([]portainer.Endpoint, error) {
	var endpoints = make([]portainer.Endpoint, 0)

	return endpoints, service.tx.GetAll(
		BucketName,
		&portainer.Endpoint{},
		dataservices.AppendFn(&endpoints),
	)
}

func (service ServiceTx) EndpointIDByEdgeID(edgeID string) (portainer.EndpointID, bool) {
	log.Error().Str("func", "EndpointIDByEdgeID").Msg("cannot be called inside a transaction")

	return 0, false
}

func (service ServiceTx) Heartbeat(endpointID portainer.EndpointID) (int64, bool) {
	log.Error().Str("func", "Heartbeat").Msg("cannot be called inside a transaction")

	return 0, false
}

func (service ServiceTx) UpdateHeartbeat(endpointID portainer.EndpointID) {
	log.Error().Str("func", "UpdateHeartbeat").Msg("cannot be called inside a transaction")
}

// CreateEndpoint assign an ID to a new environment(endpoint) and saves it.
func (service ServiceTx) Create(endpoint *portainer.Endpoint) error {
	if err := service.tx.CreateObjectWithId(BucketName, int(endpoint.ID), endpoint); err != nil {
		return err
	}

	service.service.mu.Lock()
	if len(endpoint.EdgeID) > 0 {
		service.service.idxEdgeID[endpoint.EdgeID] = endpoint.ID
	}

	service.service.heartbeats.Store(endpoint.ID, endpoint.LastCheckInDate)
	service.service.mu.Unlock()

	return nil
}

func (service ServiceTx) EndpointsByTeamID(teamID portainer.TeamID) ([]portainer.Endpoint, error) {
	var endpoints = make([]portainer.Endpoint, 0)

	return endpoints, service.tx.GetAll(
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
func (service ServiceTx) GetNextIdentifier() int {
	return service.tx.GetNextIdentifier(BucketName)
}
