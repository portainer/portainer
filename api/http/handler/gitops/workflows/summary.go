package workflows

import (
	"net/http"

	svc "github.com/portainer/portainer/api/gitops/workflows"
	"github.com/portainer/portainer/api/http/security"
	httperror "github.com/portainer/portainer/pkg/libhttp/error"
	"github.com/portainer/portainer/pkg/libhttp/response"
)

// @id GitOpsWorkflowsSummary
// @summary Summarize GitOps workflow status counts
// @description Returns a count of workflows per status across all environments.
// @description **Access policy**: authenticated
// @tags gitops
// @security ApiKeyAuth
// @security jwt
// @produce json
// @success 200 {object} svc.StatusSummary
// @failure 500 "Server error"
// @router /gitops/workflows/summary [get]
func (h *Handler) summary(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	securityContext, err := security.RetrieveRestrictedRequestContext(r)
	if err != nil {
		return httperror.InternalServerError("Unable to retrieve info from request context", err)
	}

	items, err := h.getWorkflows(cacheKey(securityContext, nil), securityContext, nil)
	if err != nil {
		return httperror.InternalServerError("Unable to retrieve workflows", err)
	}

	return response.JSON(w, svc.CountByStatus(items))
}
