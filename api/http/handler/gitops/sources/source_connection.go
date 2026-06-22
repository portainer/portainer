package sources

import (
	"context"
	"errors"
	"io"
	"net/http"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	"github.com/portainer/portainer/api/dataservices/source"
	gittypes "github.com/portainer/portainer/api/git/types"
	"github.com/portainer/portainer/api/http/security"
	httperror "github.com/portainer/portainer/pkg/libhttp/error"
	"github.com/portainer/portainer/pkg/libhttp/request"
	"github.com/portainer/portainer/pkg/libhttp/response"
)

// @id GitOpsSourcesTestById
// @summary Test the connection of a stored source
// @description Tests connectivity for a GitOps source, applying optional overrides to the stored configuration.
// @description **Access policy**: authenticated
// @tags gitops
// @security ApiKeyAuth
// @security jwt
// @accept json
// @produce json
// @param id path int true "Source identifier"
// @param body body GitSourceUpdatePayload false "Optional connection overrides; omitted fields fall back to stored values"
// @success 200 {object} ConnectionTestResult "Connection test result"
// @failure 400 "Invalid request payload"
// @failure 403 "Access denied"
// @failure 404 "Source not found"
// @failure 500 "Server error"
// @router /gitops/sources/{id}/test [post]
func (h *Handler) sourceTestConnection(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	sourceID, err := request.RetrieveNumericRouteVariableValue(r, "id")
	if err != nil {
		return httperror.BadRequest("Invalid source identifier route variable", err)
	}

	securityContext, err := security.RetrieveRestrictedRequestContext(r)
	if err != nil {
		return httperror.InternalServerError("Unable to retrieve info from request context", err)
	}

	var payload GitSourceUpdatePayload
	if err := request.DecodeAndValidateJSONPayload(r, &payload); err != nil && !errors.Is(err, io.EOF) {
		return httperror.BadRequest("Invalid request payload", err)
	}

	var src *portainer.Source
	if err := h.dataStore.ViewTx(func(tx dataservices.DataStoreTx) error {
		userContext := source.NewUserContext(securityContext.User, securityContext.UserMemberships)
		src, err = tx.Source().Read(userContext, portainer.SourceID(sourceID))
		return err
	}); h.dataStore.IsErrObjectNotFound(err) {
		return httperror.NotFound("Unable to find a source with the specified identifier", err)
	} else if errors.Is(err, source.ErrNotEnoughPermission) {
		return httperror.Forbidden("Not enough permissions to retrieve source", err)
	} else if err != nil {
		return httperror.InternalServerError("Unable to find source", err)
	}

	if err := ApplyGitSourceChanges(src, payload); errors.Is(err, ErrNotGitSource) {
		return httperror.BadRequest("Source is not a Git source", err)
	} else if err != nil {
		return httperror.InternalServerError("Unable to apply source changes", err)
	}

	if src.Git == nil {
		return httperror.InternalServerError("Source has no git configuration", nil)
	}

	result := testSourceConnection(r.Context(), h.gitService, src.Git)

	return response.JSON(w, result)
}

type ConnectionTestResult struct {
	Success bool   `json:"success"`
	Error   string `json:"error,omitempty"`
}

// @id GitOpsSourcesTest
// @summary Test a Git source connection
// @description Tests connectivity for Git connection details that have not been persisted yet.
// @description **Access policy**: authenticated
// @tags gitops
// @security ApiKeyAuth
// @security jwt
// @accept json
// @produce json
// @param body body GitSourceCreatePayload true "Git connection details"
// @success 200 {object} ConnectionTestResult "Connection test result"
// @failure 400 "Invalid request payload"
// @failure 403 "Access denied"
// @failure 500 "Server error"
// @router /gitops/sources/test [post]
func (h *Handler) gitSourceTest(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	var payload GitSourceCreatePayload
	if err := request.DecodeAndValidateJSONPayload(r, &payload); err != nil {
		return httperror.BadRequest("Invalid request payload", err)
	}

	src, err := BuildGitSource(payload)
	if err != nil {
		return httperror.BadRequest("Invalid request payload", err)
	}
	if src.Git == nil {
		return httperror.InternalServerError("Source has no git configuration", nil)
	}

	result := testSourceConnection(r.Context(), h.gitService, src.Git)

	return response.JSON(w, result)
}

// testSourceConnection verifies that a git repository is reachable with the given config.
func testSourceConnection(ctx context.Context, gitService portainer.GitService, config *gittypes.RepoConfig) ConnectionTestResult {
	var username, password string
	if config.Authentication != nil {
		username = config.Authentication.Username
		password = config.Authentication.Password
	}

	_, err := gitService.ListRefs(ctx, config.URL, username, password, false, config.TLSSkipVerify)
	if err != nil {
		return ConnectionTestResult{Success: false, Error: err.Error()}
	}

	return ConnectionTestResult{Success: true}
}
