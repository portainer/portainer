package migrator

import (
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"

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

// pruneOrphanedStackArtifacts_2_45_0 removes workflow artifacts whose backing stack or edge stack
// no longer exists (BE-13300): stack-record delete paths that bypass workflow cleanup (Kubernetes
// namespace deletion, Helm release uninstall, Edge async stack removal) leave the Artifact
// dangling, which blocks source deletion and keeps the source's poll job alive. Workflows left
// with no artifacts after pruning are deleted entirely.
func (migrator *Migrator) pruneOrphanedStackArtifacts_2_45_0() error {
	log.Info().Msg("pruning workflow artifacts referencing deleted stacks and edge stacks")

	workflows, err := migrator.workflowService.ReadAll()
	if err != nil {
		return err
	}

	for i := range workflows {
		workflow := &workflows[i]
		changed := false

		remaining := make([]portainer.Artifact, 0, len(workflow.Artifacts))
		for _, artifact := range workflow.Artifacts {
			exists, err := migrator.artifactBackingExists_2_45_0(artifact)
			if err != nil {
				return err
			}

			if exists {
				remaining = append(remaining, artifact)
			} else {
				changed = true
			}
		}

		if !changed {
			continue
		}

		if len(remaining) == 0 {
			if err := migrator.workflowService.Delete(workflow.ID); err != nil {
				return err
			}

			continue
		}

		workflow.Artifacts = remaining
		if err := migrator.workflowService.Update(workflow.ID, workflow); err != nil {
			return err
		}
	}

	return nil
}

func (migrator *Migrator) artifactBackingExists_2_45_0(a portainer.Artifact) (bool, error) {
	switch {
	case a.StackID != 0:
		return migrator.stackService.Exists(a.StackID)
	case a.EdgeStackID != 0:
		_, err := migrator.edgeStackService.EdgeStack(a.EdgeStackID)
		if dataservices.IsErrObjectNotFound(err) {
			return false, nil
		}

		return err == nil, err
	default:
		return false, nil
	}
}
