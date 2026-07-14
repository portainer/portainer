package sources

import (
	"errors"
	"time"

	portainer "github.com/portainer/portainer/api"
	gittypes "github.com/portainer/portainer/api/git/types"
	ce "github.com/portainer/portainer/api/gitops/workflows"
)

const minPollingInterval = time.Minute

func validateInterval(interval string) error {
	if interval == "" {
		return nil
	}

	d, err := time.ParseDuration(interval)
	if err != nil {
		return errors.New("invalid interval format")
	}

	if d < minPollingInterval {
		return errors.New("interval must be at least 1 minute")
	}

	return nil
}

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
		Interval:     src.Interval,
	}
}

func redactWorkflowCredentials(wfs []ce.SourceWorkflow) []ce.SourceWorkflow {
	redacted := make([]ce.SourceWorkflow, len(wfs))
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
