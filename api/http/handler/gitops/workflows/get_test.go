package workflows

import (
	"net/http"
	"net/http/httptest"
	"strconv"
	"testing"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	"github.com/portainer/portainer/api/dataservices/source"
	"github.com/portainer/portainer/api/datastore"
	gittypes "github.com/portainer/portainer/api/git/types"
	"github.com/portainer/portainer/api/gitops/workflows"

	"github.com/portainer/portainer/api/http/security"

	"github.com/segmentio/encoding/json"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// buildWorkflowGetReq creates an HTTP GET request for /gitops/workflows/{id} with a
// security context pre-populated.
func buildWorkflowGetReq(t *testing.T, userID portainer.UserID, role portainer.UserRole, id string) *http.Request {
	t.Helper()
	req := httptest.NewRequest(http.MethodGet, "/gitops/workflows/"+id, nil)
	ctx := security.StoreTokenData(req, &portainer.TokenData{ID: userID})
	req = req.WithContext(ctx)
	ctx = security.StoreRestrictedRequestContext(req, &security.RestrictedRequestContext{
		UserID:  userID,
		IsAdmin: security.IsAdminRole(role),
		User:    &portainer.User{ID: userID, Role: role},
	})
	return req.WithContext(ctx)
}

func decodeWorkflow(t *testing.T, rr *httptest.ResponseRecorder) workflows.Workflow {
	t.Helper()
	require.Equal(t, http.StatusOK, rr.Code, "unexpected status: %s", rr.Body.String())
	var detail workflows.Workflow
	require.NoError(t, json.NewDecoder(rr.Body).Decode(&detail))
	return detail
}

func TestWorkflowGet_MultiFileStackArtifact(t *testing.T) {
	t.Parallel()
	_, store := datastore.MustNewTestStore(t, false, true)

	var wfID portainer.WorkflowID
	require.NoError(t, store.UpdateTx(func(tx dataservices.DataStoreTx) error {
		src := &portainer.Source{Type: portainer.SourceTypeGit, Git: &gittypes.GitSource{URL: "https://github.com/x/repo"}}
		require.NoError(t, tx.Source().Create(source.InsecureNewAdminContext(), src))

		wf := &portainer.Workflow{Artifacts: []portainer.Artifact{{
			StackID: 1,
			Files: []portainer.ArtifactFile{
				{SourceID: src.ID, Path: "docker-compose.yml"},
				{SourceID: src.ID, Path: "override.yml"},
			},
		}}}
		require.NoError(t, tx.Workflow().Create(wf))
		wfID = wf.ID

		require.NoError(t, tx.Stack().Create(&portainer.Stack{ID: 1, Name: "gitops-stack", WorkflowID: wf.ID}))
		return tx.User().Create(&portainer.User{ID: 1, Role: portainer.AdministratorRole})
	}))

	h := NewHandler(store, nil, nil)
	rr := httptest.NewRecorder()
	h.ServeHTTP(rr, buildWorkflowGetReq(t, 1, portainer.AdministratorRole, strconv.Itoa(int(wfID))))

	detail := decodeWorkflow(t, rr)
	assert.Equal(t, wfID, detail.ID)
	require.Len(t, detail.Artifacts, 1)
	assert.Equal(t, "gitops-stack", detail.Artifacts[0].Name)
	assert.Len(t, detail.Artifacts[0].Files, 2)
}

func TestWorkflowGet_ZeroArtifactWorkflowReturnsEmptyArray(t *testing.T) {
	t.Parallel()
	_, store := datastore.MustNewTestStore(t, false, true)

	var wfID portainer.WorkflowID
	require.NoError(t, store.UpdateTx(func(tx dataservices.DataStoreTx) error {
		wf := &portainer.Workflow{Name: "empty-workflow"}
		require.NoError(t, tx.Workflow().Create(wf))
		wfID = wf.ID
		return tx.User().Create(&portainer.User{ID: 1, Role: portainer.AdministratorRole})
	}))

	h := NewHandler(store, nil, nil)
	rr := httptest.NewRecorder()
	h.ServeHTTP(rr, buildWorkflowGetReq(t, 1, portainer.AdministratorRole, strconv.Itoa(int(wfID))))

	detail := decodeWorkflow(t, rr)
	assert.Equal(t, "empty-workflow", detail.Name)
	assert.Empty(t, detail.Artifacts)
}

func TestWorkflowGet_NonexistentWorkflowReturns404(t *testing.T) {
	t.Parallel()
	_, store := datastore.MustNewTestStore(t, false, true)

	require.NoError(t, store.UpdateTx(func(tx dataservices.DataStoreTx) error {
		return tx.User().Create(&portainer.User{ID: 1, Role: portainer.AdministratorRole})
	}))

	h := NewHandler(store, nil, nil)
	rr := httptest.NewRecorder()
	h.ServeHTTP(rr, buildWorkflowGetReq(t, 1, portainer.AdministratorRole, "999"))
	assert.Equal(t, http.StatusNotFound, rr.Code)
}

func TestWorkflowGet_AllArtifactsFilteredReturns404(t *testing.T) {
	t.Parallel()
	_, store := datastore.MustNewTestStore(t, false, true)

	var wfID portainer.WorkflowID
	require.NoError(t, store.UpdateTx(func(tx dataservices.DataStoreTx) error {
		wf := &portainer.Workflow{Artifacts: []portainer.Artifact{{EdgeStackID: 1}}}
		require.NoError(t, tx.Workflow().Create(wf))
		wfID = wf.ID

		require.NoError(t, tx.EdgeStack().Create(1, &portainer.EdgeStack{ID: 1, Name: "edge-stack"}))
		require.NoError(t, tx.User().Create(&portainer.User{ID: 1, Role: portainer.AdministratorRole}))
		return tx.User().Create(&portainer.User{ID: 2, Role: portainer.StandardUserRole})
	}))

	h := NewHandler(store, nil, nil)
	rr := httptest.NewRecorder()
	h.ServeHTTP(rr, buildWorkflowGetReq(t, 2, portainer.StandardUserRole, strconv.Itoa(int(wfID))))
	assert.Equal(t, http.StatusNotFound, rr.Code)
}

func TestWorkflowGet_InvalidIDRouteVar(t *testing.T) {
	t.Parallel()
	_, store := datastore.MustNewTestStore(t, false, true)

	require.NoError(t, store.UpdateTx(func(tx dataservices.DataStoreTx) error {
		return tx.User().Create(&portainer.User{ID: 1, Role: portainer.AdministratorRole})
	}))

	h := NewHandler(store, nil, nil)
	rr := httptest.NewRecorder()
	h.ServeHTTP(rr, buildWorkflowGetReq(t, 1, portainer.AdministratorRole, "not-a-number"))
	assert.Equal(t, http.StatusBadRequest, rr.Code)
}
