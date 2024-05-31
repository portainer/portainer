package migrator

import (
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	"github.com/rs/zerolog/log"
)

func (migrator *Migrator) cleanPendingActionsForDeletedEndpointsForDB111() error {
	log.Info().Msg("cleaning up pending actions for deleted endpoints")

	pendingActions, err := migrator.pendingActionsService.ReadAll()
	if err != nil {
		return err
	}

	endpoints := make(map[portainer.EndpointID]struct{})
	for _, action := range pendingActions {
		endpoints[action.EndpointID] = struct{}{}
	}

	for endpointId := range endpoints {
		_, err := migrator.endpointService.Endpoint(endpointId)
		if dataservices.IsErrObjectNotFound(err) {
			err := migrator.pendingActionsService.DeleteByEndpointID(endpointId)
			if err != nil {
				return err
			}
		}
	}
	return nil
}
