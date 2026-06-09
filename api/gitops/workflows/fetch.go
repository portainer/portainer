package workflows

import (
	"context"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	gittypes "github.com/portainer/portainer/api/git/types"
	"github.com/portainer/portainer/api/http/security"
	"github.com/portainer/portainer/api/kubernetes/cli"
	"github.com/portainer/portainer/api/set"
)

// FetchWorkflows returns all GitOps workflows visible to the given user.
func FetchWorkflows(
	ctx context.Context,
	tx dataservices.DataStoreTx,
	gitService portainer.GitService,
	k8sFactory *cli.ClientFactory,
	sc *security.RestrictedRequestContext,
	endpointIDSet set.Set[portainer.EndpointID],
) ([]Workflow, error) {
	gitConfigs := map[portainer.StackID]*gittypes.RepoConfig{}

	stacks, err := tx.Stack().ReadAll(func(s portainer.Stack) bool {
		return s.WorkflowID != 0 && (len(endpointIDSet) == 0 || endpointIDSet.Contains(s.EndpointID))
	})
	if err != nil {
		return nil, err
	}

	endpointMap, err := buildEndpointMap(tx, stacks)
	if err != nil {
		return nil, err
	}

	stacks, err = filterDockerStacksByAccess(tx, stacks, sc)
	if err != nil {
		return nil, err
	}

	// First pass: filter by endpoint/stack-type match and collect workflow IDs.
	preFiltered := make([]portainer.Stack, 0, len(stacks))
	workflowIDSet := make(set.Set[portainer.WorkflowID], len(stacks))
	for _, stack := range stacks {
		if ep, ok := endpointMap[stack.EndpointID]; ok && !EndpointMatchesStackType(ep, stack.Type) {
			continue
		}
		preFiltered = append(preFiltered, stack)
		workflowIDSet.Add(stack.WorkflowID)
	}

	workflowMap, sourceMap, err := LoadWorkflowAndSourceMaps(tx, workflowIDSet)
	if err != nil {
		return nil, err
	}

	// Second pass: build filtered list using in-memory lookups.
	var filtered []portainer.Stack
	for _, stack := range preFiltered {
		wf := workflowMap[stack.WorkflowID]

	outer:
		for _, as := range wf.Artifacts {
			if as.StackID != stack.ID {
				continue
			}

			for _, f := range as.Files {
				src := sourceMap[f.SourceID]
				if src.Type == portainer.SourceTypeGit {
					gitConfigs[stack.ID] = MergeSourceAndFile(&src, &f)
					break outer
				}
			}
		}

		filtered = append(filtered, stack)
	}
	stacks = filtered

	accessMap, err := buildEndpointAccessMap(k8sFactory, sc, endpointMap)
	if err != nil {
		return nil, err
	}

	stacks, err = filterK8SStacks(stacks, endpointMap, k8sFactory, accessMap)
	if err != nil {
		return nil, err
	}

	items := make([]Workflow, 0, len(stacks))
	for _, stack := range stacks {
		gitConfig := gitConfigs[stack.ID]
		source, artifact := ComputeGitPhasesForConfig(ctx, gitService, gitConfig)
		items = append(items, MapStackToWorkflow(stack, gitConfig, source, artifact))
	}

	return items, nil
}

// SourceStats holds aggregated statistics for a GitOps source.
type SourceStats struct {
	WorkflowCount int
	EndpointIDs   set.Set[portainer.EndpointID]
	LastSync      int64
}

// FetchSourceStats returns all sources and per-source stats for sources accessible to the given user.
// It applies the same access control as FetchWorkflows but skips git phase checks.
func FetchSourceStats(
	tx dataservices.DataStoreTx,
	k8sFactory *cli.ClientFactory,
	sc *security.RestrictedRequestContext,
) ([]portainer.Source, map[portainer.SourceID]SourceStats, error) {
	sources, err := tx.Source().ReadAll()
	if err != nil {
		return nil, nil, err
	}

	allStacks, err := tx.Stack().ReadAll(func(s portainer.Stack) bool { return s.WorkflowID != 0 })
	if err != nil {
		return nil, nil, err
	}

	endpointMap, err := buildEndpointMap(tx, allStacks)
	if err != nil {
		return nil, nil, err
	}

	allStacks, err = filterDockerStacksByAccess(tx, allStacks, sc)
	if err != nil {
		return nil, nil, err
	}

	workflowIDSet := make(set.Set[portainer.WorkflowID], len(allStacks))
	preFiltered := make([]portainer.Stack, 0, len(allStacks))
	for _, stack := range allStacks {
		if ep, ok := endpointMap[stack.EndpointID]; ok && !EndpointMatchesStackType(ep, stack.Type) {
			continue
		}
		preFiltered = append(preFiltered, stack)
		workflowIDSet.Add(stack.WorkflowID)
	}

	wfMap, err := LoadWorkflowMap(tx, workflowIDSet)
	if err != nil {
		return nil, nil, err
	}

	wfSources := make(map[portainer.WorkflowID][]portainer.SourceID, len(wfMap))
	for id, wf := range wfMap {
		for _, as := range wf.Artifacts {
			for _, f := range as.Files {
				wfSources[id] = append(wfSources[id], f.SourceID)
			}
		}
	}

	stackSourceIDs := make(map[portainer.StackID][]portainer.SourceID)
	for _, stack := range preFiltered {
		if srcIDs := wfSources[stack.WorkflowID]; len(srcIDs) > 0 {
			stackSourceIDs[stack.ID] = srcIDs
		}
	}

	accessMap, err := buildEndpointAccessMap(k8sFactory, sc, endpointMap)
	if err != nil {
		return nil, nil, err
	}

	stacks, err := filterK8SStacks(preFiltered, endpointMap, k8sFactory, accessMap)
	if err != nil {
		return nil, nil, err
	}

	stats := make(map[portainer.SourceID]SourceStats)

	for _, stack := range stacks {
		var epIDs []portainer.EndpointID
		if stack.EndpointID != 0 {
			epIDs = []portainer.EndpointID{stack.EndpointID}
		}
		addSourceStats(stats, stackSourceIDs[stack.ID], epIDs, StackLastSyncDate(stack))
	}

	return sources, stats, nil
}

func addSourceStats(result map[portainer.SourceID]SourceStats, srcIDs []portainer.SourceID, epIDs []portainer.EndpointID, lastSync int64) {
	for _, srcID := range srcIDs {
		st := result[srcID]
		if st.EndpointIDs == nil {
			st.EndpointIDs = make(set.Set[portainer.EndpointID])
		}
		st.WorkflowCount++
		for _, epID := range epIDs {
			st.EndpointIDs.Add(epID)
		}
		st.LastSync = max(lastSync, st.LastSync)
		result[srcID] = st
	}
}
