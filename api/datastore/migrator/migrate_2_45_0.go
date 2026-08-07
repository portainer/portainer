package migrator

import (
	portainer "github.com/portainer/portainer/api"

	"github.com/rs/zerolog/log"
)

// cleanOrphanedWorkflowReferences_2_45_0 strips EnvIDs and EdgeGroups references from workflow
// artifacts that point at endpoints/edge groups deleted before the delete-time cleanup existed.
func (migrator *Migrator) cleanOrphanedWorkflowReferences_2_45_0() error {
	log.Info().Msg("cleaning up orphaned environment and edge group references in workflows")

	workflows, err := migrator.workflowService.ReadAll()
	if err != nil {
		return err
	}

	endpoints, err := migrator.endpointService.Endpoints()
	if err != nil {
		return err
	}

	validEndpoints := make(map[portainer.EndpointID]struct{}, len(endpoints))
	for _, endpoint := range endpoints {
		validEndpoints[endpoint.ID] = struct{}{}
	}

	edgeGroups, err := migrator.edgeGroupService.ReadAll()
	if err != nil {
		return err
	}

	validEdgeGroups := make(map[portainer.EdgeGroupID]struct{}, len(edgeGroups))
	for _, edgeGroup := range edgeGroups {
		validEdgeGroups[edgeGroup.ID] = struct{}{}
	}

	for i := range workflows {
		workflow := &workflows[i]
		changed := false

		for j := range workflow.Artifacts {
			artifact := &workflow.Artifacts[j]

			filteredEnvIDs := artifact.EnvIDs[:0]
			for _, id := range artifact.EnvIDs {
				if _, ok := validEndpoints[id]; ok {
					filteredEnvIDs = append(filteredEnvIDs, id)
				} else {
					changed = true
				}
			}
			artifact.EnvIDs = filteredEnvIDs

			filteredEdgeGroups := artifact.EdgeGroups[:0]
			for _, id := range artifact.EdgeGroups {
				if _, ok := validEdgeGroups[id]; ok {
					filteredEdgeGroups = append(filteredEdgeGroups, id)
				} else {
					changed = true
				}
			}
			artifact.EdgeGroups = filteredEdgeGroups
		}

		if changed {
			if err := migrator.workflowService.Update(workflow.ID, workflow); err != nil {
				return err
			}
		}
	}

	return nil
}
