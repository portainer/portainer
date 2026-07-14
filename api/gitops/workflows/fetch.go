package workflows

import (
	"slices"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	"github.com/portainer/portainer/api/dataservices/source"
	"github.com/portainer/portainer/api/http/security"
	"github.com/portainer/portainer/api/kubernetes/cli"
	"github.com/portainer/portainer/api/set"
)

// FetchWorkflows returns all GitOps workflows visible to the given user
func FetchWorkflows(
	tx dataservices.DataStoreTx,
	k8sFactory *cli.ClientFactory,
	sc *security.RestrictedRequestContext,
	endpointIDSet set.Set[portainer.EndpointID],
) ([]Workflow, error) {
	userContext := source.NewUserContext(sc.User, sc.UserMemberships)

	allWorkflows, err := tx.Workflow().ReadAll()
	if err != nil {
		return nil, err
	}

	stackIDSet := make(set.Set[portainer.StackID])
	sourceIDSet := make(set.Set[portainer.SourceID])
	for _, wf := range allWorkflows {
		for _, a := range wf.Artifacts {
			if a.StackID != 0 {
				stackIDSet.Add(a.StackID)
			}
			for _, f := range a.Files {
				sourceIDSet.Add(f.SourceID)
			}
		}
	}

	stackMap, err := loadAccessibleStackMap(tx, k8sFactory, sc, stackIDSet, endpointIDSet)
	if err != nil {
		return nil, err
	}

	sourceMap, err := LoadSourceMap(tx, userContext, sourceIDSet)
	if err != nil {
		return nil, err
	}

	items := make([]Workflow, 0, len(allWorkflows))
	for _, wf := range allWorkflows {
		artifacts := make([]ArtifactDetail, 0, len(wf.Artifacts))
		for _, a := range wf.Artifacts {
			if a.StackID == 0 {
				continue // edge-stack artifacts are resolved by the EE implementation
			}

			stack, ok := stackMap[a.StackID]
			if !ok {
				continue // filtered out by access control or endpoint scope
			}

			if stack.Type == portainer.KubernetesStack && !HasAccessibleSource(a.Files, sourceMap) {
				continue
			}

			sourcePhase, artifactPhase := ArtifactPhases(a.Files, sourceMap)
			artifacts = append(artifacts, MapStackToArtifactDetail(stack, a.Files, sourcePhase, artifactPhase))
		}

		if ShouldHideWorkflow(wf, artifacts, endpointIDSet) {
			continue
		}
		items = append(items, BuildWorkflow(wf, artifacts))
	}

	return items, nil
}

// loadAccessibleStackMap batch-loads the stacks referenced by workflows, applies the same endpoint
// scope, Docker UAC, and Kubernetes namespace RBAC filtering as the detail path, and returns the
// accessible stacks keyed by ID.
func loadAccessibleStackMap(
	tx dataservices.DataStoreTx,
	k8sFactory *cli.ClientFactory,
	sc *security.RestrictedRequestContext,
	stackIDSet set.Set[portainer.StackID],
	endpointIDSet set.Set[portainer.EndpointID],
) (map[portainer.StackID]portainer.Stack, error) {
	stacks, err := tx.Stack().ReadAll(func(s portainer.Stack) bool {
		return stackIDSet.Contains(s.ID) && (len(endpointIDSet) == 0 || endpointIDSet.Contains(s.EndpointID))
	})
	if err != nil {
		return nil, err
	}

	endpointMap, err := BuildEndpointMap(tx, stacks)
	if err != nil {
		return nil, err
	}

	stacks, err = FilterDockerStacksByAccess(tx, stacks, sc)
	if err != nil {
		return nil, err
	}

	accessMap, err := buildEndpointAccessMap(k8sFactory, sc, endpointMap)
	if err != nil {
		return nil, err
	}

	result := make(map[portainer.StackID]portainer.Stack, len(stacks))
	for _, stack := range stacks {
		if ep, ok := endpointMap[stack.EndpointID]; ok && !EndpointMatchesStackType(ep, stack.Type) {
			continue
		}

		if stack.Type == portainer.KubernetesStack {
			access := accessMap[stack.EndpointID]
			if !access.IsKubeAdmin && !slices.Contains(access.NonAdminNamespaces, stack.Namespace) {
				continue
			}
		}

		result[stack.ID] = stack
	}

	return result, nil
}

// SourceStats holds aggregated statistics for a GitOps source.
type SourceStats struct {
	WorkflowCount int
	EndpointIDs   set.Set[portainer.EndpointID]
}

// FetchSourceStats returns all sources and per-source stats for sources accessible to the given user.
// It applies the same access control as FetchWorkflows but skips git phase checks.
func FetchSourceStats(
	tx dataservices.DataStoreTx,
	k8sFactory *cli.ClientFactory,
	sc *security.RestrictedRequestContext,
) ([]portainer.Source, map[portainer.SourceID]SourceStats, error) {
	userContext := source.NewUserContext(sc.User, sc.UserMemberships)

	sources, err := tx.Source().ReadAll(userContext)
	if err != nil {
		return nil, nil, err
	}

	allStacks, err := tx.Stack().ReadAll(func(s portainer.Stack) bool { return s.WorkflowID != 0 })
	if err != nil {
		return nil, nil, err
	}

	endpointMap, err := BuildEndpointMap(tx, allStacks)
	if err != nil {
		return nil, nil, err
	}

	allStacks, err = FilterDockerStacksByAccess(tx, allStacks, sc)
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
		addSourceStats(stats, stackSourceIDs[stack.ID], epIDs)
	}

	return sources, stats, nil
}

func addSourceStats(result map[portainer.SourceID]SourceStats, srcIDs []portainer.SourceID, epIDs []portainer.EndpointID) {
	for _, srcID := range srcIDs {
		st := result[srcID]
		if st.EndpointIDs == nil {
			st.EndpointIDs = make(set.Set[portainer.EndpointID])
		}
		st.WorkflowCount++
		for _, epID := range epIDs {
			st.EndpointIDs.Add(epID)
		}
		result[srcID] = st
	}
}
