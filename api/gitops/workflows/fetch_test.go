package workflows

import (
	"strconv"
	"testing"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	"github.com/portainer/portainer/api/datastore"
	gittypes "github.com/portainer/portainer/api/git/types"
	"github.com/portainer/portainer/api/http/security"
	"github.com/portainer/portainer/api/set"

	"github.com/stretchr/testify/require"
)

func adminContext() *security.RestrictedRequestContext {
	return &security.RestrictedRequestContext{
		IsAdmin: true,
		UserID:  1,
		User:    &portainer.User{ID: 1, Role: portainer.AdministratorRole},
	}
}

func mustCreateGitWorkflow(t *testing.T, tx dataservices.DataStoreTx, stack *portainer.Stack) {
	t.Helper()

	cfg := stack.GitConfig

	src := &portainer.Source{Type: portainer.SourceTypeGit, Git: cfg}
	require.NoError(t, tx.Source().Create(adminUserContext, src))

	wf := &portainer.Workflow{Artifacts: []portainer.Artifact{{
		StackID: stack.ID,
		Files:   []portainer.ArtifactFile{{SourceID: src.ID}},
	}}}
	require.NoError(t, tx.Workflow().Create(wf))

	stack.WorkflowID = wf.ID
	stack.GitConfig = nil

	require.NoError(t, tx.Stack().Create(stack))
}

func TestAddSourceStats_NoOp(t *testing.T) {
	t.Parallel()

	result := make(map[portainer.SourceID]SourceStats)
	addSourceStats(result, nil, nil, 0)

	require.Empty(t, result)
}

func TestAddSourceStats_AccumulatesWorkflowCount(t *testing.T) {
	t.Parallel()

	result := make(map[portainer.SourceID]SourceStats)
	addSourceStats(result, []portainer.SourceID{1}, nil, 0)
	addSourceStats(result, []portainer.SourceID{1}, nil, 0)

	require.Equal(t, 2, result[1].WorkflowCount)
}

func TestAddSourceStats_CollectsUniqueEndpointIDs(t *testing.T) {
	t.Parallel()

	result := make(map[portainer.SourceID]SourceStats)
	addSourceStats(result, []portainer.SourceID{1}, []portainer.EndpointID{10, 20}, 0)
	addSourceStats(result, []portainer.SourceID{1}, []portainer.EndpointID{20, 30}, 0)

	require.Len(t, result[1].EndpointIDs, 3)
	require.True(t, result[1].EndpointIDs[10])
	require.True(t, result[1].EndpointIDs[20])
	require.True(t, result[1].EndpointIDs[30])
}

func TestAddSourceStats_MaxLastSync(t *testing.T) {
	t.Parallel()

	result := make(map[portainer.SourceID]SourceStats)
	addSourceStats(result, []portainer.SourceID{1}, nil, 100)
	addSourceStats(result, []portainer.SourceID{1}, nil, 500)
	addSourceStats(result, []portainer.SourceID{1}, nil, 200)

	require.Equal(t, int64(500), result[1].LastSync)
}

func TestAddSourceStats_MultipleSourceIDs(t *testing.T) {
	t.Parallel()

	result := make(map[portainer.SourceID]SourceStats)
	addSourceStats(result, []portainer.SourceID{1, 2}, []portainer.EndpointID{10}, 100)

	require.Equal(t, 1, result[1].WorkflowCount)
	require.Equal(t, 1, result[2].WorkflowCount)
	require.True(t, result[1].EndpointIDs[10])
	require.True(t, result[2].EndpointIDs[10])
}

func TestFetchWorkflows_ReturnsOnlyGitopsStacks(t *testing.T) {
	t.Parallel()
	_, store := datastore.MustNewTestStore(t, false, true)

	require.NoError(t, store.UpdateTx(func(tx dataservices.DataStoreTx) error {
		mustCreateGitWorkflow(t, tx, &portainer.Stack{
			ID:        1,
			Name:      "gitops-stack",
			GitConfig: &gittypes.RepoConfig{URL: "https://github.com/x/repo"},
		})
		require.NoError(t, tx.Stack().Create(&portainer.Stack{ID: 2, Name: "plain-stack"}))

		return tx.User().Create(&portainer.User{ID: 1, Role: portainer.AdministratorRole})
	}))

	var items []Workflow
	require.NoError(t, store.ViewTx(func(tx dataservices.DataStoreTx) error {
		var err error
		items, err = FetchWorkflows(t.Context(), tx, nil, nil, adminContext(), nil)
		return err
	}))
	require.Len(t, items, 1)
	require.Equal(t, "gitops-stack", items[0].Name)
}

func TestFetchWorkflows_FiltersByEndpointID(t *testing.T) {
	t.Parallel()
	_, store := datastore.MustNewTestStore(t, false, true)

	require.NoError(t, store.UpdateTx(func(tx dataservices.DataStoreTx) error {
		for i := 1; i <= 3; i++ {
			mustCreateGitWorkflow(t, tx, &portainer.Stack{
				ID:         portainer.StackID(i),
				Name:       "stack-" + strconv.Itoa(i),
				EndpointID: portainer.EndpointID(i),
				GitConfig:  &gittypes.RepoConfig{URL: "https://github.com/x/" + strconv.Itoa(i)},
			})
		}

		return tx.User().Create(&portainer.User{ID: 1, Role: portainer.AdministratorRole})
	}))

	var items []Workflow
	require.NoError(t, store.ViewTx(func(tx dataservices.DataStoreTx) error {
		var err error
		items, err = FetchWorkflows(t.Context(), tx, nil, nil, adminContext(), set.ToSet([]portainer.EndpointID{1, 2}))
		return err
	}))
	require.Len(t, items, 2)

	names := []string{items[0].Name, items[1].Name}
	require.Contains(t, names, "stack-1")
	require.Contains(t, names, "stack-2")
}

func TestFetchWorkflows_EmptyWhenNoGitopsStacks(t *testing.T) {
	t.Parallel()
	_, store := datastore.MustNewTestStore(t, false, true)

	require.NoError(t, store.UpdateTx(func(tx dataservices.DataStoreTx) error {
		require.NoError(t, tx.Stack().Create(&portainer.Stack{ID: 1, Name: "plain-1"}))
		require.NoError(t, tx.Stack().Create(&portainer.Stack{ID: 2, Name: "plain-2"}))

		return tx.User().Create(&portainer.User{ID: 1, Role: portainer.AdministratorRole})
	}))

	var items []Workflow
	require.NoError(t, store.ViewTx(func(tx dataservices.DataStoreTx) error {
		var err error
		items, err = FetchWorkflows(t.Context(), tx, nil, nil, adminContext(), nil)
		return err
	}))
	require.Empty(t, items)
}

func TestFetchWorkflows_NilEndpointSetReturnsAll(t *testing.T) {
	t.Parallel()
	_, store := datastore.MustNewTestStore(t, false, true)

	require.NoError(t, store.UpdateTx(func(tx dataservices.DataStoreTx) error {
		for i := 1; i <= 3; i++ {
			mustCreateGitWorkflow(t, tx, &portainer.Stack{
				ID:         portainer.StackID(i),
				Name:       "stack-" + strconv.Itoa(i),
				EndpointID: portainer.EndpointID(i),
				GitConfig:  &gittypes.RepoConfig{URL: "https://github.com/x/" + strconv.Itoa(i)},
			})
		}

		return tx.User().Create(&portainer.User{ID: 1, Role: portainer.AdministratorRole})
	}))

	var items []Workflow
	require.NoError(t, store.ViewTx(func(tx dataservices.DataStoreTx) error {
		var err error
		items, err = FetchWorkflows(t.Context(), tx, nil, nil, adminContext(), nil)
		return err
	}))
	require.Len(t, items, 3)
}

func TestFetchSourceStats_ReturnsAllSources(t *testing.T) {
	t.Parallel()
	_, store := datastore.MustNewTestStore(t, false, true)

	require.NoError(t, store.UpdateTx(func(tx dataservices.DataStoreTx) error {
		require.NoError(t, tx.Source().Create(adminUserContext, &portainer.Source{Name: "source-1", Type: portainer.SourceTypeGit, Git: &gittypes.RepoConfig{URL: "http://github.com/org/repo1"}}))
		require.NoError(t, tx.Source().Create(adminUserContext, &portainer.Source{Name: "source-2", Type: portainer.SourceTypeGit, Git: &gittypes.RepoConfig{URL: "http://github.com/org/repo2"}}))

		return tx.User().Create(&portainer.User{ID: 1, Role: portainer.AdministratorRole})
	}))

	var sources []portainer.Source
	require.NoError(t, store.ViewTx(func(tx dataservices.DataStoreTx) error {
		var err error
		sources, _, err = FetchSourceStats(tx, nil, adminContext())

		return err
	}))

	require.Len(t, sources, 2)
}

func TestFetchSourceStats_TracksWorkflowCountAndEndpoints(t *testing.T) {
	t.Parallel()
	_, store := datastore.MustNewTestStore(t, false, true)

	var srcID portainer.SourceID

	require.NoError(t, store.UpdateTx(func(tx dataservices.DataStoreTx) error {
		src := &portainer.Source{Name: "shared", Type: portainer.SourceTypeGit, Git: &gittypes.RepoConfig{URL: "http://github.com/org/repo"}}
		require.NoError(t, tx.Source().Create(adminUserContext, src))
		srcID = src.ID

		for i := 1; i <= 2; i++ {
			wf := &portainer.Workflow{Artifacts: []portainer.Artifact{{Files: []portainer.ArtifactFile{{SourceID: srcID}}}}}
			require.NoError(t, tx.Workflow().Create(wf))
			require.NoError(t, tx.Stack().Create(&portainer.Stack{
				ID:         portainer.StackID(i),
				Name:       "stack-" + strconv.Itoa(i),
				EndpointID: portainer.EndpointID(i),
				WorkflowID: wf.ID,
			}))
		}

		return tx.User().Create(&portainer.User{ID: 1, Role: portainer.AdministratorRole})
	}))

	var stats map[portainer.SourceID]SourceStats
	require.NoError(t, store.ViewTx(func(tx dataservices.DataStoreTx) error {
		var err error
		_, stats, err = FetchSourceStats(tx, nil, adminContext())

		return err
	}))

	st := stats[srcID]
	require.Equal(t, 2, st.WorkflowCount)
	require.Len(t, st.EndpointIDs, 2)
}

func TestFetchSourceStats_UnusedSourceHasZeroStats(t *testing.T) {
	t.Parallel()
	_, store := datastore.MustNewTestStore(t, false, true)

	var unusedID portainer.SourceID

	require.NoError(t, store.UpdateTx(func(tx dataservices.DataStoreTx) error {
		src := &portainer.Source{Name: "unused", Type: portainer.SourceTypeGit, Git: &gittypes.RepoConfig{URL: "http://github.com/org/repo"}}
		require.NoError(t, tx.Source().Create(adminUserContext, src))
		unusedID = src.ID

		return tx.User().Create(&portainer.User{ID: 1, Role: portainer.AdministratorRole})
	}))

	var stats map[portainer.SourceID]SourceStats
	require.NoError(t, store.ViewTx(func(tx dataservices.DataStoreTx) error {
		var err error
		_, stats, err = FetchSourceStats(tx, nil, adminContext())

		return err
	}))

	st := stats[unusedID]
	require.Zero(t, st.WorkflowCount)
	require.Empty(t, st.EndpointIDs)
}
