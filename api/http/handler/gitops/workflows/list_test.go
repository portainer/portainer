package workflows

import (
	"fmt"
	"net/http"
	"net/http/httptest"
	"testing"
	"testing/synctest"
	"time"

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
	assert.Equal(t, ce.TypeStack, items[0].Type)
	assert.Equal(t, "https://github.com/example/repo", items[0].GitConfig.URL)
	assert.Equal(t, "docker-compose.yml", items[0].GitConfig.ConfigFilePath)
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

func TestWorkflowsList_SearchByURL(t *testing.T) {
	t.Parallel()
	_, store := datastore.MustNewTestStore(t, false, true)

	require.NoError(t, store.UpdateTx(func(tx dataservices.DataStoreTx) error {
		createGitStack(t, tx, &portainer.Stack{
			ID: 1, Name: "stack-org1",
			GitConfig: gitConfig("https://github.com/org1/repo"),
		})
		createGitStack(t, tx, &portainer.Stack{
			ID: 2, Name: "stack-org2",
			GitConfig: gitConfig("https://github.com/org2/repo"),
		})

		require.NoError(t, tx.User().Create(&portainer.User{ID: 1, Role: portainer.AdministratorRole}))
		return nil
	}))

	h := NewHandler(store, nil, nil)
	rr := httptest.NewRecorder()
	h.ServeHTTP(rr, buildWorkflowsReq(t, 1, portainer.AdministratorRole, "search=org1"))

	items := decodeWorkflows(t, rr)
	require.Len(t, items, 1)
	assert.Equal(t, "stack-org1", items[0].Name)
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

// Uses testing/synctest to control time.Now() without real sleeps.
// The Handler is created outside the bubble so its go-cache cleanup goroutine
// does not join the bubble. Inside the bubble all time.Now() calls return
// fake time, so cache.Set stores a fake expiry and cache.Get compares
// against the same fake clock — consistent without touching real time.

func TestWorkflowsList_Cache(t *testing.T) {
	t.Parallel()
	_, store := datastore.MustNewTestStore(t, false, true)

	require.NoError(t, store.UpdateTx(func(tx dataservices.DataStoreTx) error {
		createGitStack(t, tx, &portainer.Stack{
			ID: 1, Name: "initial-stack",
			GitConfig: gitConfig("https://github.com/x/initial"),
		})

		require.NoError(t, tx.User().Create(&portainer.User{ID: 1, Role: portainer.AdministratorRole}))
		return nil
	}))

	// Create the handler outside the bubble so the go-cache cleanup goroutine
	// is not part of the bubble and does not block synctest.Test from returning.
	h := NewHandler(store, nil, nil)

	synctest.Test(t, func(t *testing.T) {
		// First request at fake T=0: populates cache.
		rr := httptest.NewRecorder()
		h.ServeHTTP(rr, buildWorkflowsReq(t, 1, portainer.AdministratorRole, ""))
		require.Len(t, decodeWorkflows(t, rr), 1)

		// Mutate the store while cache is still warm.
		createGitStack(t, store, &portainer.Stack{
			ID: 2, Name: "new-stack",
			GitConfig: gitConfig("https://github.com/x/new"),
		})

		// Second request — same cache key, should return stale cached result.
		rr = httptest.NewRecorder()
		h.ServeHTTP(rr, buildWorkflowsReq(t, 1, portainer.AdministratorRole, ""))
		assert.Len(t, decodeWorkflows(t, rr), 1, "cache hit: new stack should not appear yet")

		// Advance fake clock past the cache TTL. synctest unblocks immediately
		// since no other goroutines are in the bubble.
		time.Sleep(cacheTTL + time.Second)

		// Third request — cache expired, should now fetch fresh data.
		rr = httptest.NewRecorder()
		h.ServeHTTP(rr, buildWorkflowsReq(t, 1, portainer.AdministratorRole, ""))
		assert.Len(t, decodeWorkflows(t, rr), 2, "after TTL expiry: both stacks should appear")
	})
}

func TestWorkflowsList_CacheImmutableAfterSort(t *testing.T) {
	t.Parallel()
	_, store := datastore.MustNewTestStore(t, false, true)

	for i, name := range []string{"alpha", "beta", "gamma"} {
		require.NoError(t, store.UpdateTx(func(tx dataservices.DataStoreTx) error {
			createGitStack(t, tx, &portainer.Stack{
				ID:        portainer.StackID(i + 1),
				Name:      name,
				GitConfig: gitConfig("https://github.com/x/" + name),
			})

			require.NoError(t, tx.User().Create(&portainer.User{ID: 1, Role: portainer.AdministratorRole}))
			return nil
		}))
	}

	h := NewHandler(store, nil, nil)

	// First request: no sort — cache miss, populates cache as [alpha, beta, gamma].
	rr := httptest.NewRecorder()
	h.ServeHTTP(rr, buildWorkflowsReq(t, 1, portainer.AdministratorRole, ""))
	items := decodeWorkflows(t, rr)
	require.Len(t, items, 3)
	require.Equal(t, "alpha", items[0].Name)

	// Second request: sort desc — cache hit, sorts the shared slice in-place to [gamma, beta, alpha].
	rr = httptest.NewRecorder()
	h.ServeHTTP(rr, buildWorkflowsReq(t, 1, portainer.AdministratorRole, "sort=name&order=desc"))
	items = decodeWorkflows(t, rr)
	require.Len(t, items, 3)
	require.Equal(t, "gamma", items[0].Name)

	// Third request: no sort — should still return insertion order [alpha, beta, gamma],
	// but without a defensive clone the mutated cache returns [gamma, beta, alpha].
	rr = httptest.NewRecorder()
	h.ServeHTTP(rr, buildWorkflowsReq(t, 1, portainer.AdministratorRole, ""))
	items = decodeWorkflows(t, rr)
	require.Len(t, items, 3)
	assert.Equal(t, "alpha", items[0].Name, "sort must not mutate the cached slice")
}

func TestWorkflowsList_CacheSeparateKeys(t *testing.T) {
	t.Parallel()
	_, store := datastore.MustNewTestStore(t, false, true)

	require.NoError(t, store.UpdateTx(func(tx dataservices.DataStoreTx) error {
		createGitStack(t, tx, &portainer.Stack{
			ID: 1, Name: "env1-stack", EndpointID: 1,
			GitConfig: gitConfig("https://github.com/x/1"),
		})
		createGitStack(t, tx, &portainer.Stack{
			ID: 2, Name: "env2-stack", EndpointID: 2,
			GitConfig: gitConfig("https://github.com/x/2"),
		})
		require.NoError(t, tx.User().Create(&portainer.User{ID: 1, Role: portainer.AdministratorRole}))
		return nil
	}))

	h := NewHandler(store, nil, nil)

	rr1 := httptest.NewRecorder()
	h.ServeHTTP(rr1, buildWorkflowsReq(t, 1, portainer.AdministratorRole, "endpointIds[]=1"))
	items1 := decodeWorkflows(t, rr1)
	require.Len(t, items1, 1)
	assert.Equal(t, "env1-stack", items1[0].Name)

	rr2 := httptest.NewRecorder()
	h.ServeHTTP(rr2, buildWorkflowsReq(t, 1, portainer.AdministratorRole, "endpointIds[]=2"))
	items2 := decodeWorkflows(t, rr2)
	require.Len(t, items2, 1)
	assert.Equal(t, "env2-stack", items2[0].Name)
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

func TestWorkflowsList_RedactsCredentials(t *testing.T) {
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
	require.NotNil(t, items[0].GitConfig)
	require.NotNil(t, items[0].GitConfig.Authentication)
	assert.Equal(t, "user", items[0].GitConfig.Authentication.Username)
	assert.Empty(t, items[0].GitConfig.Authentication.Password)
}
