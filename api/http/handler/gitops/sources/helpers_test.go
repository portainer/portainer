package sources

import (
	"bytes"
	"fmt"
	"net/http"
	"net/http/httptest"
	"testing"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	"github.com/portainer/portainer/api/dataservices/source"
	gittypes "github.com/portainer/portainer/api/git/types"
	"github.com/portainer/portainer/api/http/security"
	"github.com/portainer/portainer/api/internal/testhelpers"

	"github.com/segmentio/encoding/json"
	"github.com/stretchr/testify/require"
)

var adminUserContext = source.InsecureNewAdminContext()

// createGitWorkflow creates a Source and Workflow for the given config and
// wires them up by setting stack.WorkflowID before creating the stack.
func createGitWorkflow(t *testing.T, tx dataservices.DataStoreTx, stack *portainer.Stack, cfg *gittypes.GitSource) portainer.SourceID {
	t.Helper()

	src := &portainer.Source{
		Name: gittypes.RepoName(cfg.URL),
		Type: portainer.SourceTypeGit,
		Git:  cfg,
	}
	require.NoError(t, tx.Source().Create(adminUserContext, src))

	wf := &portainer.Workflow{
		Artifacts: []portainer.Artifact{{
			StackID: stack.ID,
			Files:   []portainer.ArtifactFile{{SourceID: src.ID}},
		}},
	}
	require.NoError(t, tx.Workflow().Create(wf))

	stack.WorkflowID = wf.ID

	return src.ID
}

func newTestHandler(t *testing.T, store dataservices.DataStore) *Handler {
	t.Helper()
	return newTestHandlerWithGit(t, store, nil)
}

func newTestHandlerWithGit(t *testing.T, store dataservices.DataStore, gitService portainer.GitService) *Handler {
	t.Helper()
	return NewHandler(testhelpers.NewTestRequestBouncer(), store, gitService, nil, nil)
}

func restrictedContext(userID portainer.UserID, role portainer.UserRole) *security.RestrictedRequestContext {
	return &security.RestrictedRequestContext{
		UserID:  userID,
		IsAdmin: role == portainer.AdministratorRole,
		User:    &portainer.User{ID: userID, Role: role},
	}
}

// withRoleSecurityContext attaches the token data and restricted request context for
// userID and role to req, mirroring what the auth middleware sets up in production.
func withRoleSecurityContext(req *http.Request, userID portainer.UserID, role portainer.UserRole) *http.Request {
	req = req.WithContext(security.StoreTokenData(req, &portainer.TokenData{ID: userID}))
	req = req.WithContext(security.StoreRestrictedRequestContext(req, restrictedContext(userID, role)))
	return req
}

// withSecurityContext is withRoleSecurityContext for an admin user
func withSecurityContext(req *http.Request, userID portainer.UserID) *http.Request {
	return withRoleSecurityContext(req, userID, portainer.AdministratorRole)
}

func buildListReq(t *testing.T, userID portainer.UserID, query string) *http.Request {
	t.Helper()
	req := httptest.NewRequest(http.MethodGet, "/gitops/sources?"+query, nil)
	return withSecurityContext(req, userID)
}

func buildGetReq(t *testing.T, userID portainer.UserID, id string) *http.Request {
	t.Helper()
	req := httptest.NewRequest(http.MethodGet, "/gitops/sources/"+id, nil)
	return withSecurityContext(req, userID)
}

func decodeSources(t *testing.T, rr *httptest.ResponseRecorder) []Source {
	t.Helper()
	require.Equal(t, http.StatusOK, rr.Code, "unexpected status: %s", rr.Body.String())
	var items []Source
	require.NoError(t, json.NewDecoder(rr.Body).Decode(&items))
	return items
}

func decodeSourceDetail(t *testing.T, rr *httptest.ResponseRecorder) SourceDetail {
	t.Helper()
	require.Equal(t, http.StatusOK, rr.Code, "unexpected status: %s", rr.Body.String())
	var item SourceDetail
	require.NoError(t, json.NewDecoder(rr.Body).Decode(&item))
	return item
}

func buildGetWorkflowsReq(t *testing.T, userID portainer.UserID, id string) *http.Request {
	t.Helper()
	req := httptest.NewRequest(http.MethodGet, "/gitops/sources/"+id+"/workflows", nil)
	return withSecurityContext(req, userID)
}

func decodeSourceWorkflows(t *testing.T, rr *httptest.ResponseRecorder) []Workflow {
	t.Helper()
	require.Equal(t, http.StatusOK, rr.Code, "unexpected status: %s", rr.Body.String())
	var items []Workflow
	require.NoError(t, json.NewDecoder(rr.Body).Decode(&items))
	return items
}

func gitCfg(url string) *gittypes.GitSource {
	return &gittypes.GitSource{URL: url}
}

func buildCreateReq(t *testing.T, userID portainer.UserID, body []byte) *http.Request {
	t.Helper()
	req := httptest.NewRequest(http.MethodPost, "/gitops/sources/git", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	return withSecurityContext(req, userID)
}

func buildUpdateReq(t *testing.T, userID portainer.UserID, id int, body []byte) *http.Request {
	t.Helper()
	req := httptest.NewRequest(http.MethodPut, fmt.Sprintf("/gitops/sources/%d", id), bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	return withSecurityContext(req, userID)
}

func buildDeleteReq(t *testing.T, userID portainer.UserID, id int) *http.Request {
	t.Helper()
	req := httptest.NewRequest(http.MethodDelete, fmt.Sprintf("/gitops/sources/%d", id), nil)
	return withSecurityContext(req, userID)
}

func buildSummaryReq(t *testing.T, userID portainer.UserID) *http.Request {
	t.Helper()
	req := httptest.NewRequest(http.MethodGet, "/gitops/sources/summary", nil)
	return withSecurityContext(req, userID)
}

func buildUpdateReqWithRawID(t *testing.T, userID portainer.UserID, id string, body []byte) *http.Request {
	t.Helper()
	req := httptest.NewRequest(http.MethodPut, "/gitops/sources/"+id, bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	return withSecurityContext(req, userID)
}

func buildDeleteReqWithRawID(t *testing.T, userID portainer.UserID, id string) *http.Request {
	t.Helper()
	req := httptest.NewRequest(http.MethodDelete, "/gitops/sources/"+id, nil)
	return withSecurityContext(req, userID)
}

func buildSourceTestConnectionReq(t *testing.T, userID portainer.UserID, role portainer.UserRole, id int, body []byte) *http.Request {
	t.Helper()
	req := httptest.NewRequest(http.MethodPost, fmt.Sprintf("/gitops/sources/%d/test", id), bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	return withRoleSecurityContext(req, userID, role)
}
