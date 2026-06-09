package sources

import (
	"net/http/httptest"
	"testing"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	"github.com/portainer/portainer/api/datastore"
	gittypes "github.com/portainer/portainer/api/git/types"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestSourcesList_GroupsByURLAndCredentials(t *testing.T) {
	t.Parallel()
	_, store := datastore.MustNewTestStore(t, false, true)

	require.NoError(t, store.UpdateTx(func(tx dataservices.DataStoreTx) error {
		cfg := gitCfg("https://github.com/org/repo")
		src := &portainer.Source{Name: "repo", Type: portainer.SourceTypeGit, Git: cfg}
		require.NoError(t, tx.Source().Create(src))

		wfA := &portainer.Workflow{Artifacts: []portainer.Artifact{{Files: []portainer.ArtifactFile{{SourceID: src.ID}}}}}
		require.NoError(t, tx.Workflow().Create(wfA))

		wfB := &portainer.Workflow{Artifacts: []portainer.Artifact{{Files: []portainer.ArtifactFile{{SourceID: src.ID}}}}}
		require.NoError(t, tx.Workflow().Create(wfB))

		require.NoError(t, tx.Stack().Create(&portainer.Stack{ID: 1, Name: "stack-a", WorkflowID: wfA.ID}))
		require.NoError(t, tx.Stack().Create(&portainer.Stack{ID: 2, Name: "stack-b", WorkflowID: wfB.ID}))

		return tx.User().Create(&portainer.User{ID: 1, Role: portainer.AdministratorRole})
	}))

	h := newTestHandler(t, store)
	rr := httptest.NewRecorder()
	h.ServeHTTP(rr, buildListReq(t, 1, ""))

	sources := decodeSources(t, rr)
	require.Len(t, sources, 1)
	assert.Equal(t, 2, sources[0].UsedBy)
}

func TestSourcesList_SeparatesCredentials(t *testing.T) {
	t.Parallel()
	_, store := datastore.MustNewTestStore(t, false, true)

	require.NoError(t, store.UpdateTx(func(tx dataservices.DataStoreTx) error {
		cfg1 := gitCfg("https://github.com/org/repo")
		cfg1.Authentication = &gittypes.GitAuthentication{Username: "alice", Password: "pass1"}
		cfg2 := gitCfg("https://github.com/org/repo")
		cfg2.Authentication = &gittypes.GitAuthentication{Username: "bob", Password: "pass2"}

		stackA := &portainer.Stack{ID: 1, Name: "stack-a"}
		createGitWorkflow(t, tx, stackA, cfg1)
		require.NoError(t, tx.Stack().Create(stackA))

		stackB := &portainer.Stack{ID: 2, Name: "stack-b"}
		createGitWorkflow(t, tx, stackB, cfg2)
		require.NoError(t, tx.Stack().Create(stackB))

		return tx.User().Create(&portainer.User{ID: 1, Role: portainer.AdministratorRole})
	}))

	h := newTestHandler(t, store)
	rr := httptest.NewRecorder()
	h.ServeHTTP(rr, buildListReq(t, 1, ""))

	sources := decodeSources(t, rr)
	assert.Len(t, sources, 2)
}

func TestSourcesList_StatusFilter(t *testing.T) {
	t.Parallel()
	_, store := datastore.MustNewTestStore(t, false, true)

	// With nil gitService, source git-phase status is always StatusUnknown.
	require.NoError(t, store.UpdateTx(func(tx dataservices.DataStoreTx) error {
		stack := &portainer.Stack{ID: 1}
		createGitWorkflow(t, tx, stack, gitCfg("https://github.com/org/app"))
		require.NoError(t, tx.Stack().Create(stack))
		return tx.User().Create(&portainer.User{ID: 1, Role: portainer.AdministratorRole})
	}))

	h := newTestHandler(t, store)

	t.Run("status=unknown matches sources with unknown status", func(t *testing.T) {
		rr := httptest.NewRecorder()
		h.ServeHTTP(rr, buildListReq(t, 1, "status=unknown"))
		sources := decodeSources(t, rr)
		assert.Len(t, sources, 1)
	})

	t.Run("status=healthy excludes sources with unknown status", func(t *testing.T) {
		rr := httptest.NewRecorder()
		h.ServeHTTP(rr, buildListReq(t, 1, "status=healthy"))
		sources := decodeSources(t, rr)
		assert.Empty(t, sources)
	})
}

func TestSourcesList_SearchByURL(t *testing.T) {
	t.Parallel()
	_, store := datastore.MustNewTestStore(t, false, true)

	require.NoError(t, store.UpdateTx(func(tx dataservices.DataStoreTx) error {
		stackA := &portainer.Stack{ID: 1}
		createGitWorkflow(t, tx, stackA, gitCfg("https://github.com/org/app"))
		require.NoError(t, tx.Stack().Create(stackA))

		stackB := &portainer.Stack{ID: 2}
		createGitWorkflow(t, tx, stackB, gitCfg("https://github.com/org/infra"))
		require.NoError(t, tx.Stack().Create(stackB))

		return tx.User().Create(&portainer.User{ID: 1, Role: portainer.AdministratorRole})
	}))

	h := newTestHandler(t, store)
	rr := httptest.NewRecorder()
	h.ServeHTTP(rr, buildListReq(t, 1, "search=app"))

	sources := decodeSources(t, rr)
	require.Len(t, sources, 1)
	assert.Equal(t, "app", sources[0].Name)
}
