package workflows

import (
	"errors"
	"net/http"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	svc "github.com/portainer/portainer/api/gitops/workflows"
	"github.com/portainer/portainer/api/http/security"
	httperror "github.com/portainer/portainer/pkg/libhttp/error"
	"github.com/portainer/portainer/pkg/libhttp/request"
	"github.com/portainer/portainer/pkg/libhttp/response"
)

// @id GitOpsWorkflowGet
// @summary Get a GitOps workflow by ID
// @description Returns the detail view of a single GitOps workflow, with one entry per backing
// @description stack or edge stack artifact.
// @description **Access policy**: authenticated
// @tags gitops
// @security ApiKeyAuth
// @security jwt
// @produce json
// @param id path int true "Workflow identifier"
// @success 200 {object} svc.Workflow
// @failure 400 "Invalid request"
// @failure 404 "Workflow not found"
// @failure 500 "Server error"
// @router /gitops/workflows/{id} [get]
func (h *Handler) get(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	id, err := request.RetrieveNumericRouteVariableValue(r, "id")
	if err != nil {
		return httperror.BadRequest("Invalid workflow identifier route variable", err)
	}

	securityContext, err := security.RetrieveRestrictedRequestContext(r)
	if err != nil {
		return httperror.InternalServerError("Unable to retrieve info from request context", err)
	}

	var detail *svc.Workflow
	err = h.dataStore.ViewTx(func(tx dataservices.DataStoreTx) error {
		var err error
		detail, err = fetchWorkflowByID(tx, h.k8sFactory, securityContext, portainer.WorkflowID(id))
		return err
	})

	if h.dataStore.IsErrObjectNotFound(err) || errors.Is(err, ErrNotFound) {
		return httperror.NotFound("Workflow not found", err)
	} else if err != nil {
		return httperror.InternalServerError("Unable to retrieve workflow", err)
	}

	return response.JSON(w, detail)
}
