package sources

import (
	"slices"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	gittypes "github.com/portainer/portainer/api/git/types"
	ce "github.com/portainer/portainer/api/gitops/workflows"
	"github.com/portainer/portainer/api/set"
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

	wfIDSet := make(map[portainer.WorkflowID]struct{}, len(wfs))
	artifactByStack := make(map[portainer.StackID]portainer.ArtifactFile)
	for _, wf := range wfs {
		wfIDSet[wf.ID] = struct{}{}
		for _, art := range wf.Artifacts {
			for _, f := range art.Files {
				if f.SourceID == src.ID {
					artifactByStack[art.StackID] = f
				}
			}
		}
	}

	stacks, err := tx.Stack().ReadAll(func(s portainer.Stack) bool {
		_, ok := wfIDSet[s.WorkflowID]
		return ok
	})
	if err != nil {
		return nil, ce.SourceStats{}, err
	}

	unknown := ce.WorkflowPhaseStatus{Status: ce.StatusUnknown}
	items := make([]ce.Workflow, 0, len(stacks))
	stats := ce.SourceStats{EndpointIDs: set.Set[portainer.EndpointID]{}}

	for _, s := range stacks {
		gitCfg := gitConfigForArtifact(src.Git, artifactByStack[s.ID])
		items = append(items, ce.MapStackToWorkflow(s, gitCfg, unknown, unknown))
		stats.WorkflowCount++
		if s.EndpointID != 0 {
			stats.EndpointIDs.Add(s.EndpointID)
		}
		if lastSync := ce.StackLastSyncDate(s); lastSync > stats.LastSync {
			stats.LastSync = lastSync
		}
	}

	return items, stats, nil
}

func gitConfigForArtifact(src *gittypes.RepoConfig, af portainer.ArtifactFile) *gittypes.RepoConfig {
	if src == nil {
		return nil
	}

	return &gittypes.RepoConfig{
		URL:            src.URL,
		Authentication: src.Authentication,
		TLSSkipVerify:  src.TLSSkipVerify,
		ReferenceName:  af.Ref,
		ConfigFilePath: af.Path,
		ConfigHash:     af.Hash,
	}
}
