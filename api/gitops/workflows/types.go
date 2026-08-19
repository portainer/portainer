package workflows

import (
	"fmt"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/gitops/sources"
)

type Status string

const (
	StatusHealthy Status = "healthy"
	StatusSyncing Status = "syncing"
	StatusError   Status = "error"
	StatusPaused  Status = "paused"
	StatusUnknown Status = "unknown"
)

type Type string

const (
	TypeStack     Type = "stack"
	TypeEdgeStack Type = "edgeStack"
)

type DeploymentPlatform string

const (
	DeploymentPlatformDockerStandalone DeploymentPlatform = "dockerStandalone"
	DeploymentPlatformDockerSwarm      DeploymentPlatform = "dockerSwarm"
	DeploymentPlatformKubernetes       DeploymentPlatform = "kubernetes"
)

func ParseStatus(s string) (Status, error) {
	switch Status(s) {
	case StatusHealthy, StatusSyncing, StatusError, StatusPaused, StatusUnknown:
		return Status(s), nil
	}
	return "", fmt.Errorf("unknown status %q", s)
}

func ParseType(s string) (Type, error) {
	switch Type(s) {
	case TypeStack, TypeEdgeStack:
		return Type(s), nil
	}
	return "", fmt.Errorf("unknown type %q", s)
}

func ParsePlatform(s string) (DeploymentPlatform, error) {
	switch DeploymentPlatform(s) {
	case DeploymentPlatformDockerStandalone, DeploymentPlatformDockerSwarm, DeploymentPlatformKubernetes:
		return DeploymentPlatform(s), nil
	}
	return "", fmt.Errorf("unknown platform %q", s)
}

type Target struct {
	EndpointID          portainer.EndpointID             `json:"endpointId,omitempty"`
	Namespace           string                           `json:"namespace,omitempty"`
	EdgeGroupIDs        []portainer.EdgeGroupID          `json:"edgeGroupIds,omitempty"`
	GroupStatus         map[portainer.EdgeGroupID]Status `json:"groupStatus,omitempty"`
	ResolvedEndpointIDs []portainer.EndpointID           `json:"resolvedEndpointIds,omitempty"`
}

// WorkflowPhaseStatus represents the status of one phase (source, artifact, or target) of a workflow.
type WorkflowPhaseStatus struct {
	Status Status `json:"status"`
	Error  string `json:"error,omitempty"`
}

// WorkflowStatusObject is the structured status reported for a workflow.
type WorkflowStatusObject struct {
	Source   WorkflowPhaseStatus `json:"source"`
	Artifact WorkflowPhaseStatus `json:"artifact"`
	Target   WorkflowPhaseStatus `json:"target"`
}

// Workflow is the API representation of a workflow, used by both the list and detail endpoints.
type Workflow struct {
	ID           portainer.WorkflowID `json:"id" validate:"required"`
	Name         string               `json:"name" validate:"required"`
	Status       WorkflowStatusObject `json:"status" validate:"required"`
	Artifacts    []ArtifactDetail     `json:"artifacts"`
	CreationDate int64                `json:"creationDate"`
	LastSyncDate int64                `json:"lastSyncDate"`
}

type StatusSummary struct {
	Healthy int `json:"healthy"`
	Syncing int `json:"syncing"`
	Error   int `json:"error"`
	Paused  int `json:"paused"`
	Unknown int `json:"unknown"`
}

// ArtifactDetail describes one Artifact's backing Stack or EdgeStack.
type ArtifactDetail struct {
	ID int `json:"id" validate:"required"`
	WorkflowMappingFields
	Files []ArtifactFileDetail `json:"files"`
}

// ArtifactFileDetail describe the representation of portainer.ArtifactFile used in API responses.
type ArtifactFileDetail struct {
	portainer.ArtifactFile

	RefStatus  sources.Status `json:"refStatus,omitempty"`
	PathStatus sources.Status `json:"pathStatus,omitempty"`
}
