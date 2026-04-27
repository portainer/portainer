package workflows

import (
	"fmt"

	portainer "github.com/portainer/portainer/api"
	gittypes "github.com/portainer/portainer/api/git/types"
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
	EndpointID   portainer.EndpointID             `json:"endpointId,omitempty"`
	Namespace    string                           `json:"namespace,omitempty"`
	EdgeGroupIDs []portainer.EdgeGroupID          `json:"edgeGroupIds,omitempty"`
	GroupStatus  map[portainer.EdgeGroupID]Status `json:"groupStatus,omitempty"`
}

// WorkflowPhaseStatus represents the status of one phase (source, artifact, or target) of a workflow.
// All three phases share the Status type; source and artifact only ever emit healthy, error, or unknown.
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

type Workflow struct {
	ID           int                  `json:"id"`
	Name         string               `json:"name"`
	Type         Type                 `json:"type"`
	Platform     DeploymentPlatform   `json:"platform"`
	Status       WorkflowStatusObject `json:"status"`
	GitConfig    *gittypes.RepoConfig `json:"gitConfig,omitempty"`
	Target       Target               `json:"target"`
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
