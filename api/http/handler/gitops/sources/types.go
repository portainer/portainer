package sources

import (
	"fmt"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/gitops/workflows"
)

// Source represents a unique git repository used as a GitOps source across one or more workflows.
type Source struct {
	ID           portainer.SourceID `json:"id" validate:"required"`
	Name         string             `json:"name" validate:"required"`
	Type         SourceType         `json:"type" validate:"required"`
	URL          string             `json:"url" validate:"required"`
	Status       workflows.Status   `json:"status" validate:"required"`
	Error        string             `json:"error,omitempty"`
	UsedBy       int                `json:"usedBy"`
	Environments int                `json:"environments"`
	LastSync     int64              `json:"lastSync"`
	Interval     string             `json:"interval,omitempty" example:"5m"`
}

type SourceType string

const (
	SourceTypeGit  SourceType = "git"
	SourceTypeHelm SourceType = "helm"
	SourceTypeOCI  SourceType = "oci"
)

func parseSourceType(s string) (SourceType, error) {
	switch SourceType(s) {
	case SourceTypeGit, SourceTypeHelm, SourceTypeOCI:
		return SourceType(s), nil
	default:
		return "", fmt.Errorf("invalid source type %q: must be git, helm, or oci", s)
	}
}

func sourceTypeString(t portainer.SourceType) SourceType {
	switch t {
	case portainer.SourceTypeGit:
		return SourceTypeGit
	case portainer.SourceTypeHelm:
		return SourceTypeHelm
	case portainer.SourceTypeRegistry:
		return SourceTypeOCI
	default:
		return SourceTypeGit
	}
}
