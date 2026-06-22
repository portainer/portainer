package sources

import (
	"errors"
	"net/http"
	"slices"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	dserrors "github.com/portainer/portainer/api/dataservices/errors"
	"github.com/portainer/portainer/api/dataservices/source"
	"github.com/portainer/portainer/api/http/security"
	httperror "github.com/portainer/portainer/pkg/libhttp/error"
	"github.com/portainer/portainer/pkg/libhttp/request"
	"github.com/portainer/portainer/pkg/libhttp/response"
)

var ErrSourceInUse = errors.New("source is used by one or more workflows or custom templates")

// @id GitOpsSourcesDelete
// @summary Delete a source
// @description Deletes an existing GitOps source. Returns 409 if the source is referenced by any workflow or custom template.
// @description **Access policy**: authenticated
// @tags gitops
// @security ApiKeyAuth
// @security jwt
// @param id path int true "Source identifier"
// @success 204 "Source deleted"
// @failure 400 "Invalid request"
// @failure 403 "Access denied"
// @failure 404 "Source not found"
// @failure 409 "Source is in use by one or more workflows or custom templates"
// @failure 500 "Server error"
// @router /gitops/sources/{id} [delete]
func (h *Handler) sourceDelete(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	sourceID, err := request.RetrieveNumericRouteVariableValue(r, "id")
	if err != nil {
		return httperror.BadRequest("Invalid source identifier route variable", err)
	}

	securityContext, err := security.RetrieveRestrictedRequestContext(r)
	if err != nil {
		return httperror.InternalServerError("Unable to retrieve info from request context", err)
	}

	if err := h.dataStore.UpdateTx(func(tx dataservices.DataStoreTx) error {

		userContext := source.NewUserContext(securityContext.User, securityContext.UserMemberships)
		if exists, err := tx.Source().Exists(userContext, portainer.SourceID(sourceID)); err != nil {
			return err
		} else if !exists {
			return dserrors.ErrObjectNotFound
		}

		workflows, err := tx.Workflow().ReadAll()
		if err != nil {
			return err
		}

		for _, wf := range workflows {
			if slices.ContainsFunc(wf.Artifacts, func(as portainer.Artifact) bool {
				return slices.ContainsFunc(as.Files, func(f portainer.ArtifactFile) bool {
					return f.SourceID == portainer.SourceID(sourceID)
				})
			}) {
				return ErrSourceInUse
			}
		}

		templates, err := tx.CustomTemplate().ReadAll(func(t portainer.CustomTemplate) bool {
			return t.Artifact != nil && slices.ContainsFunc(t.Artifact.Files, func(f portainer.ArtifactFile) bool {
				return f.SourceID == portainer.SourceID(sourceID)
			})
		})
		if err != nil {
			return err
		}

		if len(templates) > 0 {
			return ErrSourceInUse
		}

		return tx.Source().Delete(userContext, portainer.SourceID(sourceID))
	}); h.dataStore.IsErrObjectNotFound(err) {
		return httperror.NotFound("Unable to find a source with the specified identifier", err)
	} else if errors.Is(err, ErrSourceInUse) {
		return httperror.Conflict("Source is used by one or more workflows or custom templates", err)
	} else if errors.Is(err, source.ErrNotEnoughPermission) {
		return httperror.Forbidden("Not enough permissions to delete source", err)
	} else if err != nil {
		return httperror.InternalServerError("Unable to delete source", err)
	}

	return response.Empty(w)
}
