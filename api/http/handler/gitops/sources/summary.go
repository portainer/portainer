package sources

import (
	"net/http"

	ce "github.com/portainer/portainer/api/gitops/workflows"
	"github.com/portainer/portainer/api/http/security"
	httperror "github.com/portainer/portainer/pkg/libhttp/error"
	"github.com/portainer/portainer/pkg/libhttp/response"
)

// @id GitOpsSourcesSummary
// @summary Summarize GitOps source status counts
// @description Returns a count of sources per status.
// @description **Access policy**: admin
// @tags gitops
// @security ApiKeyAuth
// @security jwt
// @produce json
// @success 200 {object} ce.StatusSummary
// @failure 403 "Access denied"
// @failure 500 "Server error"
// @router /gitops/sources/summary [get]
func (h *Handler) summary(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	securityContext, err := security.RetrieveRestrictedRequestContext(r)
	if err != nil {
		return httperror.InternalServerError("Unable to retrieve info from request context", err)
	}

	if !securityContext.IsAdmin {
		return httperror.Forbidden("Access denied", nil)
	}

	key := cacheKey(securityContext)

	sources, err := h.getSources(r.Context(), key, securityContext)
	if err != nil {
		return httperror.InternalServerError("Unable to retrieve sources", err)
	}

	summary := ce.StatusSummary{}
	for _, s := range sources {
		switch s.Status {
		case ce.StatusHealthy:
			summary.Healthy++
		case ce.StatusSyncing:
			summary.Syncing++
		case ce.StatusError:
			summary.Error++
		case ce.StatusPaused:
			summary.Paused++
		default:
			summary.Unknown++
		}
	}

	return response.JSON(w, summary)
}
