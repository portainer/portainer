package sources

import (
	"slices"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	ce "github.com/portainer/portainer/api/gitops/workflows"
	"github.com/portainer/portainer/api/set"
	"github.com/portainer/portainer/api/slicesx"
)

// FetchSourceWorkflows returns the workflows and stats for a single source.
func FetchSourceWorkflows(tx dataservices.DataStoreTx, src *portainer.Source) ([]ce.Workflow, ce.SourceStats, error) {
	wfs, err := tx.Workflow().ReadAll(func(wf portainer.Workflow) bool {
		return slices.ContainsFunc(wf.Artifacts, func(artifact portainer.Artifact) bool {
			return slices.ContainsFunc(artifact.Files, func(f portainer.ArtifactFile) bool {
				return f.SourceID == src.ID
			})
		})
	})
	if err != nil {
		return nil, ce.SourceStats{}, err
	}

	if len(wfs) == 0 {
		return nil, ce.SourceStats{}, nil
	}

	wfIDSet := set.ToSet(slicesx.Map(wfs, func(wf portainer.Workflow) portainer.WorkflowID { return wf.ID }))

	stacks, err := tx.Stack().ReadAll(func(s portainer.Stack) bool {
		_, ok := wfIDSet[s.WorkflowID]
		return ok
	})
	if err != nil {
		return nil, ce.SourceStats{}, err
	}

	artifactByStack := make(map[portainer.StackID]portainer.ArtifactFile)
	for _, wf := range wfs {
		for _, artifact := range wf.Artifacts {
			if artifact.StackID == 0 {
				continue
			}
			if _, exists := artifactByStack[artifact.StackID]; exists {
				continue
			}
			for _, file := range artifact.Files {
				if file.SourceID == src.ID {
					artifactByStack[artifact.StackID] = file
					break
				}
			}
		}
	}

	unknown := ce.WorkflowPhaseStatus{Status: ce.StatusUnknown}
	items := make([]ce.Workflow, 0, len(stacks))
	stats := ce.SourceStats{EndpointIDs: set.Set[portainer.EndpointID]{}}

	for _, stack := range stacks {
		cfg := src.Git.ToRepoConfig()
		if file, ok := artifactByStack[stack.ID]; ok {
			cfg.ReferenceName = file.Ref
			cfg.ConfigFilePath = file.Path
			cfg.ConfigHash = file.Hash
		}
		items = append(items, ce.MapStackToWorkflow(stack, src.ID, cfg, unknown, unknown))
		stats.WorkflowCount++
		if stack.EndpointID != 0 {
			stats.EndpointIDs.Add(stack.EndpointID)
		}
	}

	return items, stats, nil
}
