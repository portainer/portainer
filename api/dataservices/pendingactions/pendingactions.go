package pendingactions

import (
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
)

const BucketName = "pending_actions"

type Service struct {
	dataservices.BaseDataService[portainer.PendingAction, portainer.PendingActionID]
}

func NewService(connection portainer.Connection) (*Service, error) {
	err := connection.SetServiceName(BucketName)
	if err != nil {
		return nil, err
	}

	return &Service{
		BaseDataService: dataservices.BaseDataService[portainer.PendingAction, portainer.PendingActionID]{
			Bucket:     BucketName,
			Connection: connection,
		},
	}, nil
}

// GetNextIdentifier returns the next identifier for a custom template.
func (service *Service) GetNextIdentifier() int {
	return service.Connection.GetNextIdentifier(BucketName)
}

func (s Service) Create(config *portainer.PendingAction) error {
	return s.Connection.UpdateTx(func(tx portainer.Transaction) error {
		return s.Tx(tx).Create(config)
	})
}

func (s Service) Update(ID portainer.PendingActionID, config *portainer.PendingAction) error {
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
		BaseDataServiceTx: dataservices.BaseDataServiceTx[portainer.PendingAction, portainer.PendingActionID]{
			Bucket:     BucketName,
			Connection: service.Connection,
			Tx:         tx,
		},
	}
}
