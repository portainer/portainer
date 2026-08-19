package sources

import (
	"errors"
	"time"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	sourceDS "github.com/portainer/portainer/api/dataservices/source"
	gittypes "github.com/portainer/portainer/api/git/types"
	ce "github.com/portainer/portainer/api/gitops/workflows"
	httperror "github.com/portainer/portainer/pkg/libhttp/error"
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

func (h *Handler) buildSourceBase(src *portainer.Source) SourceBase {
	phase := ce.SourceStatusToPhase(src.Status, src.StatusError)

	url := ""
	if src.Git != nil {
		url = gittypes.SanitizeURL(src.Git.URL)
	}

	return SourceBase{
		ID:       src.ID,
		Name:     src.Name,
		Type:     sourceTypeString(src.Type),
		URL:      url,
		Status:   phase.Status,
		Error:    phase.Error,
		LastSync: src.LastSync,
		Interval: src.Interval,
	}
}

func (h *Handler) buildSource(src *portainer.Source, stats ce.SourceStats) Source {
	return Source{
		SourceBase:   h.buildSourceBase(src),
		UsedBy:       stats.WorkflowCount,
		Environments: len(stats.EndpointIDs),
	}
}

// sourceStore is the minimal intersection of CE and EE DataStoreTx
type sourceStore interface {
	Source() dataservices.SourceService
}

// ReadSource reads a source by ID
func ReadSource(tx sourceStore, userContext sourceDS.UserContext, sourceID portainer.SourceID) (*portainer.Source, *httperror.HandlerError) {
	source, err := tx.Source().Read(userContext, sourceID)
	if dataservices.IsErrObjectNotFound(err) {
		return nil, httperror.NotFound("Source not found", err)
	} else if errors.Is(err, sourceDS.ErrNotEnoughPermission) {
		return nil, httperror.Forbidden("Not enough permissions to retrieve source", err)
	} else if err != nil {
		return nil, httperror.InternalServerError("Unable to retrieve source", err)
	}

	return source, nil
}

// RedactWorkflowCredentials returns a copy of wfs with each git credential's password cleared.
func RedactWorkflowCredentials(wfs []Workflow) []Workflow {
	redacted := make([]Workflow, len(wfs))
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
