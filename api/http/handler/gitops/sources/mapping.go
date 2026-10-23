package sources

import (
	portainer "github.com/portainer/portainer/api"
	gittypes "github.com/portainer/portainer/api/git/types"
	"github.com/portainer/portainer/api/gitops/workflows"
)

// Workflow is the per-stack/edge-stack workflow shape returned by a source's workflows endpoint.
type Workflow struct {
	ID           portainer.WorkflowID           `json:"id" validate:"required"`
	Name         string                         `json:"name" validate:"required"`
	Type         workflows.Type                 `json:"type" validate:"required"`
	Platform     workflows.DeploymentPlatform   `json:"platform" validate:"required"`
	Status       workflows.WorkflowStatusObject `json:"status" validate:"required"`
	SourceID     portainer.SourceID             `json:"sourceId,omitempty"`
	GitConfig    *gittypes.RepoConfig           `json:"gitConfig,omitempty"`
	Target       workflows.Target               `json:"target" validate:"required"`
	CreationDate int64                          `json:"creationDate"`
	LastSyncDate int64                          `json:"lastSyncDate"`
}

// MapStackToWorkflow converts a stack to a Workflow
func MapStackToWorkflow(s portainer.Stack, sourceID portainer.SourceID, gitConfig *gittypes.RepoConfig, source, artifact workflows.WorkflowPhaseStatus) Workflow {
	f := workflows.DeriveStackWorkflowFields(s, source, artifact)
	return Workflow{
		ID:           s.WorkflowID,
		Name:         f.Name,
		Type:         f.Type,
		Platform:     f.Platform,
		Status:       f.Status,
		SourceID:     sourceID,
		GitConfig:    gitConfig,
		Target:       f.Target,
		CreationDate: f.CreationDate,
		LastSyncDate: f.LastSyncDate,
	}
}

// MapEdgeStackToWorkflow converts an edge stack to a Workflow
func MapEdgeStackToWorkflow(wfID portainer.WorkflowID, es portainer.EdgeStack, sourceID portainer.SourceID, gitConfig *gittypes.RepoConfig, statuses []portainer.EdgeStackStatusForEnv, groupEndpoints map[portainer.EdgeGroupID][]portainer.EndpointID, source, artifact workflows.WorkflowPhaseStatus) Workflow {
	f := workflows.DeriveEdgeStackWorkflowFields(es, statuses, groupEndpoints, source, artifact)
	return Workflow{
		ID:           wfID,
		Name:         f.Name,
		Type:         f.Type,
		Platform:     f.Platform,
		Status:       f.Status,
		SourceID:     sourceID,
		GitConfig:    gitConfig,
		Target:       f.Target,
		CreationDate: f.CreationDate,
		LastSyncDate: f.LastSyncDate,
	}
}
