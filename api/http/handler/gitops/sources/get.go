package sources

import (
	"net/http"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	gittypes "github.com/portainer/portainer/api/git/types"
	"github.com/portainer/portainer/api/gitops/workflows"
	httperror "github.com/portainer/portainer/pkg/libhttp/error"
	"github.com/portainer/portainer/pkg/libhttp/request"
	"github.com/portainer/portainer/pkg/libhttp/response"
)

type gitAuthInfo struct {
	Type     gittypes.GitCredentialAuthType `json:"type"`
	Username string                         `json:"username"`
}

type connectionInfo struct {
	ConfigFilePath string       `json:"configFilePath"`
	TLSSkipVerify  bool         `json:"tlsSkipVerify"`
	Authentication *gitAuthInfo `json:"authentication,omitempty"`
}

type autoUpdateInfo struct {
	Mechanism     string `json:"mechanism,omitempty"`
	FetchInterval string `json:"fetchInterval,omitempty"`
}

// SourceDetail extends Source with connection settings and linked workflows.
type SourceDetail struct {
	Source
	Connection connectionInfo       `json:"connection" validate:"required"`
	AutoUpdate *autoUpdateInfo      `json:"autoUpdate,omitempty"`
	Workflows  []workflows.Workflow `json:"workflows"`
}

// @id GitOpsSourceGet
// @summary Get a GitOps source by ID
// @description Returns a single GitOps source with its connection settings and linked workflows.
// @description **Access policy**: admin
// @tags gitops
// @security ApiKeyAuth
// @security jwt
// @produce json
// @param id path int true "Source identifier"
// @success 200 {object} SourceDetail
// @failure 400 "Invalid request"
// @failure 403 "Access denied"
// @failure 404 "Source not found"
// @failure 500 "Server error"
// @router /gitops/sources/{id} [get]
func (h *Handler) getSource(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	srcID, err := request.RetrieveNumericRouteVariableValue(r, "id")
	if err != nil {
		return httperror.BadRequest("Invalid source identifier route variable", err)
	}

	sourceID := portainer.SourceID(srcID)

	var source *portainer.Source
	var sourceWfs []workflows.Workflow
	var stats workflows.SourceStats

	err = h.dataStore.ViewTx(func(tx dataservices.DataStoreTx) error {
		var err error
		source, err = tx.Source().Read(sourceID)
		if err != nil {
			return err
		}

		sourceWfs, stats, err = FetchSourceWorkflows(tx, source)
		return err
	})

	if h.dataStore.IsErrObjectNotFound(err) {
		return httperror.NotFound("Source not found", err)
	} else if err != nil {
		return httperror.InternalServerError("Unable to retrieve source", err)
	}

	detail := BuildSourceDetail(h.buildSource(r.Context(), source, stats), source.Git, sourceWfs)
	return response.JSON(w, detail)
}

func BuildSourceDetail(baseSource Source, cfg *gittypes.RepoConfig, sourceWfs []workflows.Workflow) SourceDetail {
	var autoUpdate *autoUpdateInfo
	if len(sourceWfs) > 0 {
		autoUpdate = buildAutoUpdateInfo(sourceWfs[0].AutoUpdate)
	}

	return SourceDetail{
		Source:     baseSource,
		Connection: buildConnectionInfo(cfg),
		AutoUpdate: autoUpdate,
		Workflows:  redactWorkflowCredentials(sourceWfs),
	}
}

func buildConnectionInfo(cfg *gittypes.RepoConfig) connectionInfo {
	if cfg == nil {
		return connectionInfo{}
	}
	return connectionInfo{
		ConfigFilePath: cfg.ConfigFilePath,
		TLSSkipVerify:  cfg.TLSSkipVerify,
		Authentication: buildGitAuthInfo(cfg.Authentication),
	}
}

func buildGitAuthInfo(auth *gittypes.GitAuthentication) *gitAuthInfo {
	if auth == nil {
		return nil
	}
	return &gitAuthInfo{
		Type:     auth.AuthorizationType,
		Username: auth.Username,
	}
}

func buildAutoUpdateInfo(autoUpdate *portainer.AutoUpdateSettings) *autoUpdateInfo {
	if autoUpdate == nil {
		return nil
	}

	switch {
	case autoUpdate.Interval != "":
		return &autoUpdateInfo{
			Mechanism:     "Interval",
			FetchInterval: autoUpdate.Interval,
		}
	case autoUpdate.Webhook != "":
		return &autoUpdateInfo{
			Mechanism: "Webhook",
		}
	default:
		return nil
	}
}
