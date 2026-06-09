package sources

import (
	"context"

	portainer "github.com/portainer/portainer/api"
	gittypes "github.com/portainer/portainer/api/git/types"
	ce "github.com/portainer/portainer/api/gitops/workflows"
)

func (h *Handler) buildSource(ctx context.Context, src *portainer.Source, stats ce.SourceStats) Source {
	var status ce.Status
	var sourceErr string
	if src.Git != nil {
		phase, _ := ce.ComputeGitPhasesForConfig(ctx, h.gitService, src.Git)
		status = phase.Status
		sourceErr = phase.Error
	} else {
		status = ce.StatusUnknown
	}

	url := ""
	var provider gittypes.GitProvider
	if src.Git != nil {
		url = gittypes.SanitizeURL(src.Git.URL)
		if src.Git.Authentication != nil {
			provider = src.Git.Authentication.Provider
		}
	}

	return Source{
		ID:           src.ID,
		Name:         src.Name,
		Type:         sourceTypeString(src.Type),
		URL:          url,
		Status:       status,
		Error:        sourceErr,
		Provider:     provider,
		UsedBy:       stats.WorkflowCount,
		Environments: len(stats.EndpointIDs),
		LastSync:     stats.LastSync,
	}
}

func redactWorkflowCredentials(wfs []ce.Workflow) []ce.Workflow {
	redacted := make([]ce.Workflow, len(wfs))
	for i, wf := range wfs {
		redacted[i] = wf
		if wf.GitConfig != nil && wf.GitConfig.Authentication != nil {
			cfg := *wf.GitConfig
			auth := *wf.GitConfig.Authentication
			auth.Password = ""
			cfg.Authentication = &auth
			redacted[i].GitConfig = &cfg
		}
	}
	return redacted
}
