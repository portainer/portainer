package pendingactions

import (
	"fmt"
	"time"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	"github.com/rs/zerolog/log"
)

const (
	BucketName = "pending_actions"
)

type Service struct {
	dataservices.BaseDataService[portainer.PendingActions, portainer.PendingActionsID]
}

type ServiceTx struct {
	dataservices.BaseDataServiceTx[portainer.PendingActions, portainer.PendingActionsID]
}

func NewService(connection portainer.Connection) (*Service, error) {
	err := connection.SetServiceName(BucketName)
	if err != nil {
		return nil, err
	}

	return &Service{
		BaseDataService: dataservices.BaseDataService[portainer.PendingActions, portainer.PendingActionsID]{
			Bucket:     BucketName,
			Connection: connection,
		},
	}, nil
}

func (s Service) Create(config *portainer.PendingActions) error {
	return s.Connection.UpdateTx(func(tx portainer.Transaction) error {
		return s.Tx(tx).Create(config)
	})
}

func (s Service) Update(ID portainer.PendingActionsID, config *portainer.PendingActions) error {
	return s.Connection.UpdateTx(func(tx portainer.Transaction) error {
		return s.Tx(tx).Update(ID, config)
	})
}

func (s Service) DeleteByEndpointID(ID portainer.EndpointID) error {
	return s.Connection.UpdateTx(func(tx portainer.Transaction) error {
		return s.Tx(tx).DeleteByEndpointID(ID)
	})
}

func (service *Service) Tx(tx portainer.Transaction) ServiceTx {
	return ServiceTx{
		BaseDataServiceTx: dataservices.BaseDataServiceTx[portainer.PendingActions, portainer.PendingActionsID]{
			Bucket:     BucketName,
			Connection: service.Connection,
			Tx:         tx,
		},
	}
}

func (s ServiceTx) Create(config *portainer.PendingActions) error {
	return s.Tx.CreateObject(BucketName, func(id uint64) (int, interface{}) {
		config.ID = portainer.PendingActionsID(id)
		config.CreatedAt = time.Now().Unix()

		return int(config.ID), config
	})
}

func (s ServiceTx) Update(ID portainer.PendingActionsID, config *portainer.PendingActions) error {
	return s.BaseDataServiceTx.Update(ID, config)
}

func (s ServiceTx) DeleteByEndpointID(ID portainer.EndpointID) error {
	log.Debug().Int("endpointId", int(ID)).Msg("deleting pending actions for endpoint")
	pendingActions, err := s.BaseDataServiceTx.ReadAll()
	if err != nil {
		return fmt.Errorf("failed to retrieve pending-actions for endpoint (%d): %w", ID, err)
	}

	for _, pendingAction := range pendingActions {
		if pendingAction.EndpointID == ID {
			err := s.BaseDataServiceTx.Delete(pendingAction.ID)
			if err != nil {
				log.Debug().Int("endpointId", int(ID)).Msgf("failed to delete pending action: %v", err)
			}
		}
	}
	return nil
}

// GetNextIdentifier returns the next identifier for a custom template.
func (service ServiceTx) GetNextIdentifier() int {
	return service.Tx.GetNextIdentifier(BucketName)
}

// GetNextIdentifier returns the next identifier for a custom template.
func (service *Service) GetNextIdentifier() int {
	return service.Connection.GetNextIdentifier(BucketName)
}
