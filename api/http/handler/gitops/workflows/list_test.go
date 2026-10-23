package workflows

import (
	"fmt"
	"net/http"
	"net/http/httptest"
	"testing"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	"github.com/portainer/portainer/api/datastore"
	gittypes "github.com/portainer/portainer/api/git/types"
	ce "github.com/portainer/portainer/api/gitops/workflows"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestWorkflowsList_GitConfigFilter(t *testing.T) {
	t.Parallel()
	_, store := datastore.MustNewTestStore(t, false, true)

	require.NoError(t, store.UpdateTx(func(tx dataservices.DataStoreTx) error {
		createGitStack(t, tx, &portainer.Stack{
			ID: 1, Name: "gitops-stack",
			GitConfig: gitConfig("https://github.com/example/repo"),
		})
		require.NoError(t, tx.Stack().Create(&portainer.Stack{ID: 2, Name: "plain-stack"}))
		require.NoError(t, tx.User().Create(&portainer.User{ID: 1, Role: portainer.AdministratorRole}))
		return nil
	}))

	h := NewHandler(store, nil, nil)
	rr := httptest.NewRecorder()
	h.ServeHTTP(rr, buildWorkflowsReq(t, 1, portainer.AdministratorRole, ""))

	items := decodeWorkflows(t, rr)
	require.Len(t, items, 1)
	assert.Equal(t, "gitops-stack", items[0].Name)
	require.Len(t, items[0].Artifacts, 1)
	assert.Equal(t, ce.TypeStack, items[0].Artifacts[0].Type)
	require.Len(t, items[0].Artifacts[0].Files, 1)
	assert.Equal(t, "docker-compose.yml", items[0].Artifacts[0].Files[0].Path)
}

func TestWorkflowsList_EndpointIDsFilter(t *testing.T) {
	t.Parallel()
	_, store := datastore.MustNewTestStore(t, false, true)

	require.NoError(t, store.UpdateTx(func(tx dataservices.DataStoreTx) error {
		for i := 1; i <= 3; i++ {
			createGitStack(t, tx, &portainer.Stack{
				ID:         portainer.StackID(i),
				Name:       fmt.Sprintf("env%d-stack", i),
				EndpointID: portainer.EndpointID(i),
				GitConfig:  gitConfig(fmt.Sprintf("https://github.com/x/%d", i)),
			})
		}
		require.NoError(t, tx.User().Create(&portainer.User{ID: 1, Role: portainer.AdministratorRole}))
		return nil
	}))

	h := NewHandler(store, nil, nil)
	rr := httptest.NewRecorder()
	h.ServeHTTP(rr, buildWorkflowsReq(t, 1, portainer.AdministratorRole, "endpointIds[]=1&endpointIds[]=2"))

	items := decodeWorkflows(t, rr)
	require.Len(t, items, 2)
	names := []string{items[0].Name, items[1].Name}
	assert.Contains(t, names, "env1-stack")
	assert.Contains(t, names, "env2-stack")
}

func TestWorkflowsList_Pagination(t *testing.T) {
	t.Parallel()
	_, store := datastore.MustNewTestStore(t, false, true)

	require.NoError(t, store.UpdateTx(func(tx dataservices.DataStoreTx) error {
		for i := 1; i <= 5; i++ {
			createGitStack(t, tx, &portainer.Stack{
				ID:        portainer.StackID(i),
				Name:      fmt.Sprintf("stack-%d", i),
				GitConfig: gitConfig(fmt.Sprintf("https://github.com/x/y-%d", i)),
			})
		}

		require.NoError(t, tx.User().Create(&portainer.User{ID: 1, Role: portainer.AdministratorRole}))
		return nil
	}))

	h := NewHandler(store, nil, nil)
	rr := httptest.NewRecorder()
	h.ServeHTTP(rr, buildWorkflowsReq(t, 1, portainer.AdministratorRole, "start=0&limit=2"))

	items := decodeWorkflows(t, rr)
	assert.Len(t, items, 2)
	assert.Equal(t, "5", rr.Header().Get("X-Total-Count"))
}

func TestWorkflowsList_Search(t *testing.T) {
	t.Parallel()
	_, store := datastore.MustNewTestStore(t, false, true)

	require.NoError(t, store.UpdateTx(func(tx dataservices.DataStoreTx) error {
		for _, s := range []*portainer.Stack{
			{ID: 1, Name: "alpha", GitConfig: gitConfig("https://github.com/org/alpha")},
			{ID: 2, Name: "beta", GitConfig: gitConfig("https://github.com/org/beta")},
		} {
			createGitStack(t, tx, s)
		}

		require.NoError(t, tx.User().Create(&portainer.User{ID: 1, Role: portainer.AdministratorRole}))
		return nil
	}))

	h := NewHandler(store, nil, nil)
	rr := httptest.NewRecorder()
	h.ServeHTTP(rr, buildWorkflowsReq(t, 1, portainer.AdministratorRole, "search=alpha"))

	items := decodeWorkflows(t, rr)
	require.Len(t, items, 1)
	assert.Equal(t, "alpha", items[0].Name)
}

func TestWorkflowsList_SearchMatchesNameOnly(t *testing.T) {
	t.Parallel()
	_, store := datastore.MustNewTestStore(t, false, true)

	require.NoError(t, store.UpdateTx(func(tx dataservices.DataStoreTx) error {
		createGitStack(t, tx, &portainer.Stack{
			ID: 1, Name: "alpha",
			GitConfig: gitConfig("https://github.com/needle/repo"),
		})
		createGitStack(t, tx, &portainer.Stack{
			ID: 2, Name: "beta",
			GitConfig: gitConfig("https://github.com/other/repo"),
		})

		require.NoError(t, tx.User().Create(&portainer.User{ID: 1, Role: portainer.AdministratorRole}))
		return nil
	}))

	h := NewHandler(store, nil, nil)

	// Searching by a term that only appears in the git URL must not match — search is name-only.
	rr := httptest.NewRecorder()
	h.ServeHTTP(rr, buildWorkflowsReq(t, 1, portainer.AdministratorRole, "search=needle"))
	require.Empty(t, decodeWorkflows(t, rr))

	// Searching by name matches.
	rr = httptest.NewRecorder()
	h.ServeHTTP(rr, buildWorkflowsReq(t, 1, portainer.AdministratorRole, "search=alpha"))
	items := decodeWorkflows(t, rr)
	require.Len(t, items, 1)
	assert.Equal(t, "alpha", items[0].Name)
}

func TestWorkflowsList_Sort(t *testing.T) {
	t.Parallel()
	_, store := datastore.MustNewTestStore(t, false, true)

	require.NoError(t, store.UpdateTx(func(tx dataservices.DataStoreTx) error {
		for i, name := range []string{"gamma", "alpha", "beta"} {
			createGitStack(t, tx, &portainer.Stack{
				ID:        portainer.StackID(i + 1),
				Name:      name,
				GitConfig: gitConfig("https://github.com/x/" + name),
			})
		}
		require.NoError(t, tx.User().Create(&portainer.User{ID: 1, Role: portainer.AdministratorRole}))
		return nil
	}))

	h := NewHandler(store, nil, nil)
	rr := httptest.NewRecorder()
	h.ServeHTTP(rr, buildWorkflowsReq(t, 1, portainer.AdministratorRole, "sort=name&order=desc"))

	items := decodeWorkflows(t, rr)
	require.Len(t, items, 3)
	assert.Equal(t, "gamma", items[0].Name)
	assert.Equal(t, "beta", items[1].Name)
	assert.Equal(t, "alpha", items[2].Name)
}

func TestWorkflowsList_StatusFilter(t *testing.T) {
	t.Parallel()
	_, store := datastore.MustNewTestStore(t, false, true)

	require.NoError(t, store.UpdateTx(func(tx dataservices.DataStoreTx) error {
		createGitStack(t, tx, &portainer.Stack{
			ID: 1, Name: "healthy-stack",
			GitConfig: gitConfig("https://github.com/x/1"),
		})
		createGitStack(t, tx, &portainer.Stack{
			ID: 2, Name: "error-stack",
			GitConfig:        gitConfig("https://github.com/x/2"),
			DeploymentStatus: []portainer.StackDeploymentStatus{{Status: portainer.StackStatusError}},
		})
		require.NoError(t, tx.User().Create(&portainer.User{ID: 1, Role: portainer.AdministratorRole}))
		return nil
	}))

	h := NewHandler(store, nil, nil)

	t.Run("status=healthy returns only healthy workflows", func(t *testing.T) {
		rr := httptest.NewRecorder()
		h.ServeHTTP(rr, buildWorkflowsReq(t, 1, portainer.AdministratorRole, "status=healthy"))
		items := decodeWorkflows(t, rr)
		require.Len(t, items, 1)
		assert.Equal(t, "healthy-stack", items[0].Name)
	})

	t.Run("status=error returns only error workflows", func(t *testing.T) {
		rr := httptest.NewRecorder()
		h.ServeHTTP(rr, buildWorkflowsReq(t, 1, portainer.AdministratorRole, "status=error"))
		items := decodeWorkflows(t, rr)
		require.Len(t, items, 1)
		assert.Equal(t, "error-stack", items[0].Name)
	})
}

func TestWorkflowsList_InvalidFilterParams(t *testing.T) {
	t.Parallel()
	_, store := datastore.MustNewTestStore(t, false, true)
	require.NoError(t, store.User().Create(&portainer.User{ID: 1, Role: portainer.AdministratorRole}))
	h := NewHandler(store, nil, nil)

	for _, query := range []string{"status=garbage", "type=garbage", "platform=garbage"} {
		t.Run(query, func(t *testing.T) {
			t.Parallel()
			rr := httptest.NewRecorder()
			h.ServeHTTP(rr, buildWorkflowsReq(t, 1, portainer.AdministratorRole, query))
			assert.Equal(t, http.StatusBadRequest, rr.Code)
		})
	}
}

func TestWorkflowsList_DoesNotLeakCredentials(t *testing.T) {
	t.Parallel()
	_, store := datastore.MustNewTestStore(t, false, true)

	cfg := gitConfig("https://github.com/x/secure")
	cfg.Authentication = &gittypes.GitAuthentication{Username: "user", Password: "s3cr3t"}

	require.NoError(t, store.UpdateTx(func(tx dataservices.DataStoreTx) error {
		createGitStack(t, tx, &portainer.Stack{
			ID: 1, Name: "secure-stack", GitConfig: cfg,
		})
		require.NoError(t, tx.User().Create(&portainer.User{ID: 1, Role: portainer.AdministratorRole}))
		return nil
	}))

	h := NewHandler(store, nil, nil)
	rr := httptest.NewRecorder()
	h.ServeHTTP(rr, buildWorkflowsReq(t, 1, portainer.AdministratorRole, ""))

	items := decodeWorkflows(t, rr)
	require.Len(t, items, 1)
	// Source credentials must never be part of the workflow summary payload.
	assert.NotContains(t, rr.Body.String(), "s3cr3t")
}
