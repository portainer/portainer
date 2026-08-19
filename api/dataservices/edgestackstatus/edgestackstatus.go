package edgestackstatus

import (
	"encoding/binary"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
)

var _ dataservices.EdgeStackStatusService = &Service{}

const BucketName = "edge_stack_status"

type Service struct {
	conn portainer.Connection
}

func (service *Service) BucketName() string {
	return BucketName
}

func NewService(connection portainer.Connection) (*Service, error) {
	if err := connection.SetServiceName(BucketName); err != nil {
		return nil, err
	}

	return &Service{conn: connection}, nil
}

func (s *Service) Tx(tx portainer.Transaction) ServiceTx {
	return ServiceTx{
		service: s,
		tx:      tx,
	}
}

func (s *Service) Create(edgeStackID portainer.EdgeStackID, endpointID portainer.EndpointID, status *portainer.EdgeStackStatusForEnv) error {
	return s.conn.UpdateTx(func(tx portainer.Transaction) error {
		return s.Tx(tx).Create(edgeStackID, endpointID, status)
	})
}

func (s *Service) Read(edgeStackID portainer.EdgeStackID, endpointID portainer.EndpointID) (*portainer.EdgeStackStatusForEnv, error) {
	var element *portainer.EdgeStackStatusForEnv

	return element, s.conn.ViewTx(func(tx portainer.Transaction) error {
		var err error
		element, err = s.Tx(tx).Read(edgeStackID, endpointID)

		return err
	})
}

func (s *Service) ReadAll(edgeStackID portainer.EdgeStackID) ([]portainer.EdgeStackStatusForEnv, error) {
	var collection = make([]portainer.EdgeStackStatusForEnv, 0)

	return collection, s.conn.ViewTx(func(tx portainer.Transaction) error {
		var err error
		collection, err = s.Tx(tx).ReadAll(edgeStackID)

		return err
	})
}

func (s *Service) Update(edgeStackID portainer.EdgeStackID, endpointID portainer.EndpointID, status *portainer.EdgeStackStatusForEnv) error {
	return s.conn.UpdateTx(func(tx portainer.Transaction) error {
		return s.Tx(tx).Update(edgeStackID, endpointID, status)
	})
}

func (s *Service) Delete(edgeStackID portainer.EdgeStackID, endpointID portainer.EndpointID) error {
	return s.conn.UpdateTx(func(tx portainer.Transaction) error {
		return s.Tx(tx).Delete(edgeStackID, endpointID)
	})
}

func (s *Service) DeleteAll(edgeStackID portainer.EdgeStackID) error {
	return s.conn.UpdateTx(func(tx portainer.Transaction) error {
		return s.Tx(tx).DeleteAll(edgeStackID)
	})
}

func (s *Service) Clear(edgeStackID portainer.EdgeStackID, relatedEnvironmentsIDs []portainer.EndpointID) error {
	return s.conn.UpdateTx(func(tx portainer.Transaction) error {
		return s.Tx(tx).Clear(edgeStackID, relatedEnvironmentsIDs)
	})
}

func (s *Service) key(edgeStackID portainer.EdgeStackID, endpointID portainer.EndpointID) []byte {
	k := make([]byte, 16)
	binary.BigEndian.PutUint64(k[:8], uint64(edgeStackID))
	binary.BigEndian.PutUint64(k[8:], uint64(endpointID))

	return k
}
