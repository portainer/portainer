package sources

import (
	"bytes"
	"fmt"
	"net/http"
	"net/http/httptest"
	"testing"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	gittypes "github.com/portainer/portainer/api/git/types"
	"github.com/portainer/portainer/api/http/security"
	"github.com/portainer/portainer/api/internal/testhelpers"

	"github.com/segmentio/encoding/json"
	"github.com/stretchr/testify/require"
)

// createGitWorkflow creates a Source and Workflow for the given config and
// wires them up by setting stack.WorkflowID before creating the stack.
func createGitWorkflow(t *testing.T, tx dataservices.DataStoreTx, stack *portainer.Stack, cfg *gittypes.RepoConfig) portainer.SourceID {
	t.Helper()

	src := &portainer.Source{
		Name: gittypes.RepoName(cfg.URL),
		Type: portainer.SourceTypeGit,
		Git:  cfg,
	}
	require.NoError(t, tx.Source().Create(src))

	wf := &portainer.Workflow{
		Artifacts: []portainer.Artifact{{
			StackID: stack.ID,
			Files: []portainer.ArtifactFile{{
				SourceID: src.ID,
				Path:     cfg.ConfigFilePath,
				Ref:      cfg.ReferenceName,
			}},
		}},
	}
	require.NoError(t, tx.Workflow().Create(wf))

	stack.WorkflowID = wf.ID

	return src.ID
}

func newTestHandler(t *testing.T, store dataservices.DataStore) *Handler {
	t.Helper()
	return NewHandler(testhelpers.NewTestRequestBouncer(), store, nil, nil)
}

func buildListReq(t *testing.T, userID portainer.UserID, query string) *http.Request {
	t.Helper()
	req := httptest.NewRequest(http.MethodGet, "/gitops/sources?"+query, nil)
	req = req.WithContext(security.StoreTokenData(req, &portainer.TokenData{ID: userID}))
	req = req.WithContext(security.StoreRestrictedRequestContext(req, &security.RestrictedRequestContext{
		UserID: userID, IsAdmin: true,
	}))
	return req
}

func buildGetReq(t *testing.T, userID portainer.UserID, id string) *http.Request {
	t.Helper()
	req := httptest.NewRequest(http.MethodGet, "/gitops/sources/"+id, nil)
	req = req.WithContext(security.StoreTokenData(req, &portainer.TokenData{ID: userID}))
	req = req.WithContext(security.StoreRestrictedRequestContext(req, &security.RestrictedRequestContext{
		UserID: userID, IsAdmin: true,
	}))
	return req
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

func gitCfg(url string) *gittypes.RepoConfig {
	return &gittypes.RepoConfig{
		URL:            url,
		ConfigFilePath: "docker-compose.yml",
		ReferenceName:  "refs/heads/main",
	}
}

func buildCreateReq(t *testing.T, userID portainer.UserID, body []byte) *http.Request {
	t.Helper()
	req := httptest.NewRequest(http.MethodPost, "/gitops/sources/git", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	req = req.WithContext(security.StoreTokenData(req, &portainer.TokenData{ID: userID}))
	req = req.WithContext(security.StoreRestrictedRequestContext(req, &security.RestrictedRequestContext{
		UserID: userID, IsAdmin: true,
	}))
	return req
}

func buildUpdateReq(t *testing.T, userID portainer.UserID, id int, body []byte) *http.Request {
	t.Helper()
	req := httptest.NewRequest(http.MethodPut, fmt.Sprintf("/gitops/sources/%d", id), bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	req = req.WithContext(security.StoreTokenData(req, &portainer.TokenData{ID: userID}))
	req = req.WithContext(security.StoreRestrictedRequestContext(req, &security.RestrictedRequestContext{
		UserID: userID, IsAdmin: true,
	}))
	return req
}

func buildDeleteReq(t *testing.T, userID portainer.UserID, id int) *http.Request {
	t.Helper()
	req := httptest.NewRequest(http.MethodDelete, fmt.Sprintf("/gitops/sources/%d", id), nil)
	req = req.WithContext(security.StoreTokenData(req, &portainer.TokenData{ID: userID}))
	req = req.WithContext(security.StoreRestrictedRequestContext(req, &security.RestrictedRequestContext{
		UserID: userID, IsAdmin: true,
	}))
	return req
}

func buildSummaryReq(t *testing.T, userID portainer.UserID) *http.Request {
	t.Helper()
	req := httptest.NewRequest(http.MethodGet, "/gitops/sources/summary", nil)
	req = req.WithContext(security.StoreTokenData(req, &portainer.TokenData{ID: userID}))
	req = req.WithContext(security.StoreRestrictedRequestContext(req, &security.RestrictedRequestContext{
		UserID: userID, IsAdmin: true,
	}))
	return req
}

func buildUpdateReqWithRawID(t *testing.T, userID portainer.UserID, id string, body []byte) *http.Request {
	t.Helper()
	req := httptest.NewRequest(http.MethodPut, "/gitops/sources/"+id, bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	req = req.WithContext(security.StoreTokenData(req, &portainer.TokenData{ID: userID}))
	req = req.WithContext(security.StoreRestrictedRequestContext(req, &security.RestrictedRequestContext{
		UserID: userID, IsAdmin: true,
	}))
	return req
}

func buildDeleteReqWithRawID(t *testing.T, userID portainer.UserID, id string) *http.Request {
	t.Helper()
	req := httptest.NewRequest(http.MethodDelete, "/gitops/sources/"+id, nil)
	req = req.WithContext(security.StoreTokenData(req, &portainer.TokenData{ID: userID}))
	req = req.WithContext(security.StoreRestrictedRequestContext(req, &security.RestrictedRequestContext{
		UserID: userID, IsAdmin: true,
	}))
	return req
}
