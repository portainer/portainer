package migrator

import portainer "github.com/portainer/portainer/api"

func (m *Migrator) migrateEdgeStacksStatuses_2_31_0() error {
	edgeStacks, err := m.edgeStackService.EdgeStacks()
	if err != nil {
		return err
	}

	for _, edgeStack := range edgeStacks {
		for envID, status := range edgeStack.Status {
			if err := m.edgeStackStatusService.Create(edgeStack.ID, envID, &portainer.EdgeStackStatusForEnv{
				EndpointID:       envID,
				Status:           status.Status,
				DeploymentInfo:   status.DeploymentInfo,
				ReadyRePullImage: status.ReadyRePullImage,
			}); err != nil {
				return err
			}
		}

		edgeStack.Status = nil

		if err := m.edgeStackService.UpdateEdgeStack(edgeStack.ID, &edgeStack); err != nil {
			return err
		}
	}

	return nil
}
