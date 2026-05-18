package workflows

import (
	portainer "github.com/portainer/portainer/api"
	gittypes "github.com/portainer/portainer/api/git/types"
	"github.com/portainer/portainer/api/set"
)

// MapStackToWorkflow converts a stack to a Workflow. gitConfig is passed separately
// because EE embeds a different GitConfig type that shadows the CE field.
// source and artifact are the pre-computed git phase statuses from the caller.
func MapStackToWorkflow(s portainer.Stack, gitConfig *gittypes.RepoConfig, source, artifact WorkflowPhaseStatus) Workflow {
	return Workflow{
		ID:       int(s.ID),
		Name:     s.Name,
		Type:     TypeStack,
		Platform: platformFromStackType(s.Type),
		Status: WorkflowStatusObject{
			Source:   source,
			Artifact: artifact,
			Target:   deriveStackTargetState(s),
		},
		GitConfig: gitConfig,
		Target: Target{
			EndpointID: s.EndpointID,
			Namespace:  s.Namespace,
		},
		CreationDate: s.CreationDate,
		LastSyncDate: stackLastSyncDate(s),
	}
}

// MapEdgeStackToWorkflow converts an edge stack to a Workflow. gitConfig is passed separately
// because EE embeds a different GitConfig type that shadows the CE field.
// source and artifact are the pre-computed git phase statuses from the caller.
func MapEdgeStackToWorkflow(es portainer.EdgeStack, gitConfig *gittypes.RepoConfig, statuses []portainer.EdgeStackStatusForEnv, groupEndpoints map[portainer.EdgeGroupID][]portainer.EndpointID, source, artifact WorkflowPhaseStatus) Workflow {
	platform := DeploymentPlatformDockerStandalone
	if es.DeploymentType == portainer.EdgeStackDeploymentKubernetes {
		platform = DeploymentPlatformKubernetes
	}
	return Workflow{
		ID:       int(es.ID),
		Name:     es.Name,
		Type:     TypeEdgeStack,
		Platform: platform,
		Status: WorkflowStatusObject{
			Source:   source,
			Artifact: artifact,
			Target:   deriveEdgeStackTargetState(statuses),
		},
		GitConfig: gitConfig,
		Target: Target{
			EdgeGroupIDs:        es.EdgeGroups,
			GroupStatus:         edgeStackTargetStatuses(es.EdgeGroups, statuses, groupEndpoints),
			ResolvedEndpointIDs: resolveEdgeGroupEndpoints(es.EdgeGroups, groupEndpoints),
		},
		CreationDate: es.CreationDate,
		LastSyncDate: edgeStackLastSyncDate(statuses),
	}
}

func stackLastSyncDate(s portainer.Stack) int64 {
	for i := len(s.DeploymentStatus) - 1; i >= 0; i-- {
		if s.DeploymentStatus[i].Status == portainer.StackStatusActive {
			return s.DeploymentStatus[i].Time
		}
	}
	return 0
}

func edgeStackLastSyncDate(statuses []portainer.EdgeStackStatusForEnv) int64 {
	var oldest int64
	for _, epStatus := range statuses {
		last := endpointLastSyncDate(epStatus)
		if last == 0 {
			return 0
		}
		if oldest == 0 || last < oldest {
			oldest = last
		}
	}
	return oldest
}

func endpointLastSyncDate(epStatus portainer.EdgeStackStatusForEnv) int64 {
	for i := len(epStatus.Status) - 1; i >= 0; i-- {
		if isEdgeStackHealthyStatus(epStatus.Status[i].Type) {
			return epStatus.Status[i].Time
		}
	}
	return 0
}

func platformFromStackType(t portainer.StackType) DeploymentPlatform {
	switch t {
	case portainer.KubernetesStack:
		return DeploymentPlatformKubernetes
	case portainer.DockerSwarmStack:
		return DeploymentPlatformDockerSwarm
	default:
		return DeploymentPlatformDockerStandalone
	}
}

func isEdgeStackHealthyStatus(t portainer.EdgeStackStatusType) bool {
	switch t {
	case portainer.EdgeStackStatusRunning,
		portainer.EdgeStackStatusRolledBack,
		portainer.EdgeStackStatusCompleted,
		portainer.EdgeStackStatusRemoved,
		portainer.EdgeStackStatusRemoteUpdateSuccess:
		return true
	}
	return false
}

func resolveEdgeGroupEndpoints(groups []portainer.EdgeGroupID, groupEndpoints map[portainer.EdgeGroupID][]portainer.EndpointID) []portainer.EndpointID {
	seen := set.Set[portainer.EndpointID]{}
	for _, gid := range groups {
		for _, epID := range groupEndpoints[gid] {
			seen.Add(epID)

		}
	}
	return seen.Keys()
}

func edgeStackTargetStatuses(
	groups []portainer.EdgeGroupID,
	statuses []portainer.EdgeStackStatusForEnv,
	groupEndpoints map[portainer.EdgeGroupID][]portainer.EndpointID,
) map[portainer.EdgeGroupID]Status {
	epMap := make(map[portainer.EndpointID]Status, len(statuses))
	for _, s := range statuses {
		ws, _ := endpointWorkflowStatus(s)
		epMap[s.EndpointID] = ws
	}

	result := make(map[portainer.EdgeGroupID]Status, len(groups))
	for _, gid := range groups {
		gStatus := StatusUnknown
		for _, epID := range groupEndpoints[gid] {
			if ws := epMap[epID]; statusPriority(ws) > statusPriority(gStatus) {
				gStatus = ws
			}
		}
		result[gid] = gStatus
	}
	return result
}
