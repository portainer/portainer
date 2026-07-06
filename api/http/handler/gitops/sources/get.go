package sources

import (
	"errors"
	"net/http"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	sourceDS "github.com/portainer/portainer/api/dataservices/source"
	gittypes "github.com/portainer/portainer/api/git/types"
	"github.com/portainer/portainer/api/gitops/workflows"
	"github.com/portainer/portainer/api/http/security"
	httperror "github.com/portainer/portainer/pkg/libhttp/error"
	"github.com/portainer/portainer/pkg/libhttp/request"
	"github.com/portainer/portainer/pkg/libhttp/response"
)

type gitAuthInfo struct {
	Username string `json:"username"`
}

type connectionInfo struct {
	TLSSkipVerify  bool         `json:"tlsSkipVerify"`
	Authentication *gitAuthInfo `json:"authentication,omitempty"`
}

type AutoUpdateInfo struct {
	Mechanism     string `json:"mechanism,omitempty"`
	FetchInterval string `json:"fetchInterval,omitempty"`
}

type SourceAccess struct {
	Public bool               `json:"public,omitempty"`
	Users  []portainer.UserID `json:"users,omitempty"`
	Teams  []portainer.TeamID `json:"teams,omitempty"`
}

// SourceDetail extends Source with connection settings and linked workflows.
type SourceDetail struct {
	Source
	Connection connectionInfo       `json:"connection" validate:"required"`
	AutoUpdate *AutoUpdateInfo      `json:"autoUpdate,omitempty"`
	Workflows  []workflows.Workflow `json:"workflows"`
	Access     SourceAccess         `json:"access"`
}

// @id GitOpsSourceGet
// @summary Get a GitOps source by ID
// @description Returns a single GitOps source with its connection settings and linked workflows.
// @description **Access policy**: authenticated
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

	securityContext, err := security.RetrieveRestrictedRequestContext(r)
	if err != nil {
		return httperror.InternalServerError("Unable to retrieve info from request context", err)
	}

	sourceID := portainer.SourceID(srcID)

	var source *portainer.Source
	var sourceWfs []workflows.Workflow
	var stats workflows.SourceStats

	err = h.dataStore.ViewTx(func(tx dataservices.DataStoreTx) error {
		var err error
		userContext := sourceDS.NewUserContext(securityContext.User, securityContext.UserMemberships)
		source, err = tx.Source().Read(userContext, sourceID)
		if err != nil {
			return err
		}

		sourceWfs, stats, err = FetchSourceWorkflows(tx, source)
		return err
	})

	if h.dataStore.IsErrObjectNotFound(err) {
		return httperror.NotFound("Source not found", err)
	} else if errors.Is(err, sourceDS.ErrNotEnoughPermission) {
		return httperror.Forbidden("Not enough permissions to retrieve source", err)
	} else if err != nil {
		return httperror.InternalServerError("Unable to retrieve source", err)
	}

	access := BuildSourceAccess(source)

	detail := BuildSourceDetail(h.buildSource(source, stats), source.Git, sourceWfs, access)
	return response.JSON(w, detail)
}

func BuildSourceDetail(baseSource Source, cfg *gittypes.GitSource, sourceWfs []workflows.Workflow, access SourceAccess) SourceDetail {
	var autoUpdate *AutoUpdateInfo
	if len(sourceWfs) > 0 {
		autoUpdate = BuildAutoUpdateInfo(sourceWfs[0].AutoUpdate)
	}

	return SourceDetail{
		Source:     baseSource,
		Connection: buildConnectionInfo(cfg),
		AutoUpdate: autoUpdate,
		Workflows:  redactWorkflowCredentials(sourceWfs),
		Access:     access,
	}
}

func BuildSourceAccess(source *portainer.Source) SourceAccess {
	if source == nil {
		return SourceAccess{}
	}

	if source.AdministratorsOnly {
		return SourceAccess{}
	}

	if source.Public {
		return SourceAccess{
			Public: true,
		}
	}

	return SourceAccess{
		Public: source.Public,
		Users:  source.UserAccesses,
		Teams:  source.TeamAccesses,
	}
}

func buildConnectionInfo(cfg *gittypes.GitSource) connectionInfo {
	if cfg == nil {
		return connectionInfo{}
	}
	return connectionInfo{
		TLSSkipVerify:  cfg.TLSSkipVerify,
		Authentication: buildGitAuthInfo(cfg.Authentication),
	}
}

func buildGitAuthInfo(auth *gittypes.GitAuthentication) *gitAuthInfo {
	if auth == nil {
		return nil
	}
	return &gitAuthInfo{
		Username: auth.Username,
	}
}

func BuildAutoUpdateInfo(autoUpdate *portainer.AutoUpdateSettings) *AutoUpdateInfo {
	if autoUpdate == nil {
		return nil
	}

	switch {
	case autoUpdate.Interval != "":
		return &AutoUpdateInfo{
			Mechanism:     "Interval",
			FetchInterval: autoUpdate.Interval,
		}
	case autoUpdate.Webhook != "":
		return &AutoUpdateInfo{
			Mechanism: "Webhook",
		}
	default:
		return nil
	}
}
