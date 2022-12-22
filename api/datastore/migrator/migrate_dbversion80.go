package migrator

import (
	portainer "github.com/portainer/portainer/api"

	"github.com/rs/zerolog/log"
)

func (m *Migrator) migrateDBVersionToDB80() error {
	return m.updateEdgeStackStatusForDB80()
}

func (m *Migrator) updateEdgeStackStatusForDB80() error {
	log.Info().Msg("transfer type field to details field for edge stack status")

	edgeStacks, err := m.edgeStackService.EdgeStacks()
	if err != nil {
		return err
	}

	for _, edgeStack := range edgeStacks {
		for endpointId, status := range edgeStack.Status {
			switch status.Type {
			case portainer.EdgeStackStatusPending:
				status.Details.Pending = true
			case portainer.EdgeStackStatusOk:
				status.Details.Ok = true
			case portainer.EdgeStackStatusError:
				status.Details.Error = true
			case portainer.EdgeStackStatusAcknowledged:
				status.Details.Acknowledged = true
			case portainer.EdgeStackStatusRemove:
				status.Details.Remove = true
			case portainer.EdgeStackStatusRemoteUpdateSuccess:
				status.Details.RemoteUpdateSuccess = true
			}

			edgeStack.Status[endpointId] = status
		}

		err = m.edgeStackService.UpdateEdgeStack(edgeStack.ID, &edgeStack)
		if err != nil {
			return err
		}
	}
	return nil
}
