package endpointrelation

import (
	"sync"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	"github.com/portainer/portainer/api/internal/edge/cache"
)

// BucketName represents the name of the bucket where this service stores data.
const BucketName = "endpoint_relations"

// Service represents a service for managing environment(endpoint) relation data.
type Service struct {
	connection             portainer.Connection
	updateStackFnTx        func(tx portainer.Transaction, ID portainer.EdgeStackID, updateFunc func(edgeStack *portainer.EdgeStack)) error
	endpointRelationsCache []portainer.EndpointRelation
	mu                     sync.Mutex
}

var _ dataservices.EndpointRelationService = &Service{}

func (service *Service) BucketName() string {
	return BucketName
}

func (service *Service) RegisterUpdateStackFunction(
	updateFuncTx func(portainer.Transaction, portainer.EdgeStackID, func(*portainer.EdgeStack)) error,
) {
	service.updateStackFnTx = updateFuncTx
}

// NewService creates a new instance of a service.
func NewService(connection portainer.Connection) (*Service, error) {
	if err := connection.SetServiceName(BucketName); err != nil {
		return nil, err
	}

	return &Service{
		connection: connection,
	}, nil
}

func (service *Service) Tx(tx portainer.Transaction) ServiceTx {
	return ServiceTx{
		service: service,
		tx:      tx,
	}
}

// EndpointRelations returns an array of all EndpointRelations
func (service *Service) EndpointRelations() ([]portainer.EndpointRelation, error) {
	var all = make([]portainer.EndpointRelation, 0)

	return all, service.connection.GetAll(
		BucketName,
		&portainer.EndpointRelation{},
		dataservices.AppendFn(&all),
	)
}

// EndpointRelation returns a Environment(Endpoint) relation object by EndpointID
func (service *Service) EndpointRelation(endpointID portainer.EndpointID) (*portainer.EndpointRelation, error) {
	var endpointRelation portainer.EndpointRelation
	identifier := service.connection.ConvertToKey(int(endpointID))

	if err := service.connection.GetObject(BucketName, identifier, &endpointRelation); err != nil {
		return nil, err
	}

	return &endpointRelation, nil
}

// CreateEndpointRelation saves endpointRelation
func (service *Service) Create(endpointRelation *portainer.EndpointRelation) error {
	err := service.connection.CreateObjectWithId(BucketName, int(endpointRelation.EndpointID), endpointRelation)
	cache.Del(endpointRelation.EndpointID)

	service.mu.Lock()
	service.endpointRelationsCache = nil
	service.mu.Unlock()

	return err
}

// UpdateEndpointRelation updates an Environment(Endpoint) relation object
func (service *Service) UpdateEndpointRelation(endpointID portainer.EndpointID, endpointRelation *portainer.EndpointRelation) error {
	return service.connection.UpdateTx(func(tx portainer.Transaction) error {
		return service.Tx(tx).UpdateEndpointRelation(endpointID, endpointRelation)
	})
}

func (service *Service) AddEndpointRelationsForEdgeStack(endpointIDs []portainer.EndpointID, edgeStack *portainer.EdgeStack) error {
	return service.connection.UpdateTx(func(tx portainer.Transaction) error {
		return service.Tx(tx).AddEndpointRelationsForEdgeStack(endpointIDs, edgeStack)
	})
}

func (service *Service) RemoveEndpointRelationsForEdgeStack(endpointIDs []portainer.EndpointID, edgeStackID portainer.EdgeStackID) error {
	return service.connection.UpdateTx(func(tx portainer.Transaction) error {
		return service.Tx(tx).RemoveEndpointRelationsForEdgeStack(endpointIDs, edgeStackID)
	})
}

// DeleteEndpointRelation deletes an Environment(Endpoint) relation object
func (service *Service) DeleteEndpointRelation(endpointID portainer.EndpointID) error {
	return service.connection.UpdateTx(func(tx portainer.Transaction) error {
		return service.Tx(tx).DeleteEndpointRelation(endpointID)
	})
}
