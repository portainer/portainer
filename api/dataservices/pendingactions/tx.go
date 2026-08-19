package pendingactions

import (
	"fmt"
	"time"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	"github.com/rs/zerolog/log"
)

type ServiceTx struct {
	dataservices.BaseDataServiceTx[portainer.PendingAction, portainer.PendingActionID]
}

func (s ServiceTx) Create(config *portainer.PendingAction) error {
	return s.Tx.CreateObject(BucketName, func(id uint64) (int, any) {
		config.ID = portainer.PendingActionID(id)
		config.CreatedAt = time.Now().Unix()

		return int(config.ID), config
	})
}

func (s ServiceTx) Update(ID portainer.PendingActionID, config *portainer.PendingAction) error {
	return s.BaseDataServiceTx.Update(ID, config)
}

func (s ServiceTx) DeleteByEndpointID(ID portainer.EndpointID) error {
	log.Debug().Int("endpointId", int(ID)).Msg("deleting pending actions for endpoint")
	pendingActions, err := s.ReadAll()
	if err != nil {
		return fmt.Errorf("failed to retrieve pending-actions for endpoint (%d): %w", ID, err)
	}

	for _, pendingAction := range pendingActions {
		if pendingAction.EndpointID == ID {
			if err := s.Delete(pendingAction.ID); err != nil {
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
