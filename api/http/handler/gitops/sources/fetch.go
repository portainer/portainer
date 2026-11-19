package sources

import (
	"slices"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	ce "github.com/portainer/portainer/api/gitops/workflows"
	"github.com/portainer/portainer/api/http/security"
	"github.com/portainer/portainer/api/kubernetes/cli"
	"github.com/portainer/portainer/api/set"
	"github.com/portainer/portainer/api/slicesx"
)

// FetchSourceWorkflows returns the workflows of a single source that sc can access.
func FetchSourceWorkflows(
	tx dataservices.DataStoreTx,
	k8sFactory *cli.ClientFactory,
	sc *security.RestrictedRequestContext,
	src *portainer.Source,
) ([]Workflow, error) {
	wfs, err := tx.Workflow().ReadAll(func(wf portainer.Workflow) bool {
		return slices.ContainsFunc(wf.Artifacts, func(artifact portainer.Artifact) bool {
			return slices.ContainsFunc(artifact.Files, func(f portainer.ArtifactFile) bool {
				return f.SourceID == src.ID
			})
		})
	})
	if err != nil {
		return nil, err
	}

	if len(wfs) == 0 {
		return nil, nil
	}

	wfIDSet := set.ToSet(slicesx.Map(wfs, func(wf portainer.Workflow) portainer.WorkflowID { return wf.ID }))

	stacks, err := tx.Stack().ReadAll(func(s portainer.Stack) bool {
		_, ok := wfIDSet[s.WorkflowID]
		return ok
	})
	if err != nil {
		return nil, err
	}

	stacks, err = ce.AccessibleStacks(tx, k8sFactory, sc, stacks)
	if err != nil {
		return nil, err
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
	items := make([]Workflow, 0, len(stacks))

	for _, stack := range stacks {
		cfg := src.Git.ToRepoConfig()
		if file, ok := artifactByStack[stack.ID]; ok {
			cfg.ReferenceName = file.Ref
			cfg.ConfigFilePath = file.Path
			cfg.ConfigHash = file.Hash
		}
		items = append(items, MapStackToWorkflow(stack, src.ID, cfg, unknown, unknown))
	}

	return items, nil
}
