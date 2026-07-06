package sources

import (
	portainer "github.com/portainer/portainer/api"
	gittypes "github.com/portainer/portainer/api/git/types"
	ce "github.com/portainer/portainer/api/gitops/workflows"
)

func (h *Handler) buildSource(src *portainer.Source, stats ce.SourceStats) Source {
	phase := ce.SourceStatusToPhase(src.Status, src.StatusError)

	url := ""
	if src.Git != nil {
		url = gittypes.SanitizeURL(src.Git.URL)
	}

	return Source{
		ID:           src.ID,
		Name:         src.Name,
		Type:         sourceTypeString(src.Type),
		URL:          url,
		Status:       phase.Status,
		Error:        phase.Error,
		UsedBy:       stats.WorkflowCount,
		Environments: len(stats.EndpointIDs),
		LastSync:     src.LastSync,
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
