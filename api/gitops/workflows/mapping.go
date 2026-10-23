package workflows

import (
	"fmt"
	"slices"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	"github.com/portainer/portainer/api/gitops/sources"
	"github.com/portainer/portainer/api/internal/endpointutils"
	"github.com/portainer/portainer/api/set"
	"github.com/portainer/portainer/api/slicesx"
)

// BuildGroupEndpoints builds a map between EdgeGroup id and its endpoints
func BuildGroupEndpoints(tx dataservices.DataStoreTx, groups []portainer.EdgeGroup) (map[portainer.EdgeGroupID][]portainer.EndpointID, error) {
	m := make(map[portainer.EdgeGroupID][]portainer.EndpointID, len(groups))
	for _, g := range groups {
		if g.Dynamic {
			ids, err := endpointutils.GetEndpointsByTags(tx, g.TagIDs, g.PartialMatch)
			if err != nil {
				return nil, fmt.Errorf("failed to resolve endpoints for dynamic edge group: %w", err)
			}
			m[g.ID] = ids
		} else {
			m[g.ID] = g.EndpointIDs.ToSlice()
		}
	}
	return m, nil
}

// WorkflowMappingFields holds the fields shared between ArtifactDetail and the sources handler package's Workflow type.
type WorkflowMappingFields struct {
	Type         Type                          `json:"type" validate:"required"`
	Name         string                        `json:"name" validate:"required"`
	Platform     DeploymentPlatform            `json:"platform"`
	Status       WorkflowStatusObject          `json:"status"`
	AutoUpdate   *portainer.AutoUpdateSettings `json:"autoUpdate,omitempty"`
	Target       Target                        `json:"target"`
	CreationDate int64                         `json:"creationDate"`
	LastSyncDate int64                         `json:"lastSyncDate"`
}

// DeriveStackWorkflowFields computes the shared WorkflowMappingFields for a Stack-backed deployment.
func DeriveStackWorkflowFields(s portainer.Stack, source, artifact WorkflowPhaseStatus) WorkflowMappingFields {
	return WorkflowMappingFields{
		Type:     TypeStack,
		Name:     s.Name,
		Platform: platformFromStackType(s.Type),
		Status: WorkflowStatusObject{
			Source:   source,
			Artifact: artifact,
			Target:   deriveStackTargetState(s),
		},
		AutoUpdate: s.AutoUpdate,
		Target: Target{
			EndpointID: s.EndpointID,
			Namespace:  s.Namespace,
		},
		CreationDate: s.CreationDate,
		LastSyncDate: StackLastSyncDate(s),
	}
}

// DeriveEdgeStackWorkflowFields computes the shared WorkflowMappingFields for an EdgeStack-backed deployment.
func DeriveEdgeStackWorkflowFields(es portainer.EdgeStack, statuses []portainer.EdgeStackStatusForEnv, groupEndpoints map[portainer.EdgeGroupID][]portainer.EndpointID, source, artifact WorkflowPhaseStatus) WorkflowMappingFields {
	platform := DeploymentPlatformDockerStandalone
	if es.DeploymentType == portainer.EdgeStackDeploymentKubernetes {
		platform = DeploymentPlatformKubernetes
	}
	return WorkflowMappingFields{
		Type:     TypeEdgeStack,
		Name:     es.Name,
		Platform: platform,
		Status: WorkflowStatusObject{
			Source:   source,
			Artifact: artifact,
			Target:   deriveEdgeStackTargetState(statuses),
		},
		Target: Target{
			EdgeGroupIDs:        es.EdgeGroups,
			GroupStatus:         edgeStackTargetStatuses(es.EdgeGroups, statuses, groupEndpoints),
			ResolvedEndpointIDs: resolveEdgeGroupEndpoints(es.EdgeGroups, groupEndpoints),
		},
		CreationDate: es.CreationDate,
		LastSyncDate: edgeStackLastSyncDate(statuses),
	}
}

// MapStackToArtifactDetail converts a stack to an ArtifactDetail.
func MapStackToArtifactDetail(stack portainer.Stack, files []portainer.ArtifactFile, source, artifact WorkflowPhaseStatus) ArtifactDetail {
	return ArtifactDetail{
		ID:                    int(stack.ID),
		WorkflowMappingFields: DeriveStackWorkflowFields(stack, source, artifact),
		Files:                 mapFilesToFileDetails(files),
	}
}

// MapEdgeStackToArtifactDetail converts an edge stack to an ArtifactDetail.
func MapEdgeStackToArtifactDetail(es portainer.EdgeStack, files []portainer.ArtifactFile, statuses []portainer.EdgeStackStatusForEnv, groupEndpoints map[portainer.EdgeGroupID][]portainer.EndpointID, source, artifact WorkflowPhaseStatus) ArtifactDetail {
	return ArtifactDetail{
		ID:                    int(es.ID),
		WorkflowMappingFields: DeriveEdgeStackWorkflowFields(es, statuses, groupEndpoints, source, artifact),
		Files:                 mapFilesToFileDetails(files),
	}
}

func StackLastSyncDate(s portainer.Stack) int64 {
	for _, ds := range slices.Backward(s.DeploymentStatus) {
		if ds.Status == portainer.StackStatusActive {
			return ds.Time
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
	for _, s := range slices.Backward(epStatus.Status) {
		if isEdgeStackHealthyStatus(s.Type) {
			return s.Time
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

// BuildWorkflow assembles a Workflow from a domain workflow and its resolved, access-filtered artifacts.
func BuildWorkflow(wf portainer.Workflow, artifacts []ArtifactDetail) Workflow {
	creation, lastSync := SummaryDates(artifacts)
	return Workflow{
		ID:           wf.ID,
		Name:         workflowName(wf),
		Status:       aggregateWorkflowStatus(artifacts),
		Artifacts:    artifacts,
		CreationDate: creation,
		LastSyncDate: lastSync,
	}
}

// workflowName returns the workflow's stored name, falling back to a placeholder when it has none.
func workflowName(wf portainer.Workflow) string {
	if wf.Name != "" {
		return wf.Name
	}

	return "Unnamed workflow"
}

// ShouldHideWorkflow reports whether a workflow must be hidden from the list (all artifacts filtered out, or none exist while an endpoint filter is active).
func ShouldHideWorkflow(wf portainer.Workflow, artifacts []ArtifactDetail, endpointIDSet set.Set[portainer.EndpointID]) bool {
	if len(artifacts) > 0 {
		return false
	}
	return len(wf.Artifacts) > 0 || len(endpointIDSet) > 0
}

// SummaryDates derives the earliest creation date and most recent sync date across artifacts, ignoring zero values.
func SummaryDates(artifacts []ArtifactDetail) (creation, lastSync int64) {
	for _, a := range artifacts {
		if a.CreationDate != 0 && (creation == 0 || a.CreationDate < creation) {
			creation = a.CreationDate
		}
		if a.LastSyncDate > lastSync {
			lastSync = a.LastSyncDate
		}
	}
	return creation, lastSync
}

func mapFilesToFileDetails(files []portainer.ArtifactFile) []ArtifactFileDetail {
	return slicesx.Map(files, func(file portainer.ArtifactFile) ArtifactFileDetail {
		return ArtifactFileDetail{
			ArtifactFile: file,
			RefStatus:    sources.StatusString(file.RefStatus),
			PathStatus:   sources.StatusString(file.PathStatus),
		}
	})
}
