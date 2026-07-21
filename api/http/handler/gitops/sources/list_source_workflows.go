package sources

import (
	"net/http"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	sourceDS "github.com/portainer/portainer/api/dataservices/source"
	"github.com/portainer/portainer/api/http/security"
	httperror "github.com/portainer/portainer/pkg/libhttp/error"
	"github.com/portainer/portainer/pkg/libhttp/request"
	"github.com/portainer/portainer/pkg/libhttp/response"
)

// @id GitOpsSourceWorkflowsList
// @summary List the workflows using a GitOps source
// @description Returns the workflows (stacks or edge stacks) currently deployed from this source.
// @description **Access policy**: authenticated
// @tags gitops
// @security ApiKeyAuth
// @security jwt
// @produce json
// @param id path int true "Source identifier"
// @success 200 {array} Workflow
// @failure 400 "Invalid request"
// @failure 403 "Access denied"
// @failure 404 "Source not found"
// @failure 500 "Server error"
// @router /gitops/sources/{id}/workflows [get]
func (h *Handler) listSourceWorkflows(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	srcID, err := request.RetrieveNumericRouteVariableValue(r, "id")
	if err != nil {
		return httperror.BadRequest("Invalid source identifier route variable", err)
	}

	securityContext, err := security.RetrieveRestrictedRequestContext(r)
	if err != nil {
		return httperror.InternalServerError("Unable to retrieve info from request context", err)
	}

	sourceID := portainer.SourceID(srcID)

	var sourceWfs []Workflow

	err = h.dataStore.ViewTx(func(tx dataservices.DataStoreTx) error {
		userContext := sourceDS.NewUserContext(securityContext.User, securityContext.UserMemberships)
		source, handlerErr := ReadSource(tx, userContext, sourceID)
		if handlerErr != nil {
			return handlerErr
		}

		var err error
		sourceWfs, _, err = FetchSourceWorkflows(tx, source)
		return err
	})

	return response.TxFuncResponse(err, func() *httperror.HandlerError {
		return response.JSON(w, RedactWorkflowCredentials(sourceWfs))
	})
}
