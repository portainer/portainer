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

	src := &portainer.Source{Type: portainer.SourceTypeGit, Git: &gittypes.GitSource{URL: cfg.URL, Authentication: cfg.Authentication, TLSSkipVerify: cfg.TLSSkipVerify}}
	require.NoError(t, tx.Source().Create(adminUserContext, src))

	wf := &portainer.Workflow{Name: stack.Name, Artifacts: []portainer.Artifact{{
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
	addSourceStats(result, nil, nil)

	require.Empty(t, result)
}

func TestAddSourceStats_AccumulatesWorkflowCount(t *testing.T) {
	t.Parallel()

	result := make(map[portainer.SourceID]SourceStats)
	addSourceStats(result, []portainer.SourceID{1}, nil)
	addSourceStats(result, []portainer.SourceID{1}, nil)

	require.Equal(t, 2, result[1].WorkflowCount)
}

func TestAddSourceStats_CollectsUniqueEndpointIDs(t *testing.T) {
	t.Parallel()

	result := make(map[portainer.SourceID]SourceStats)
	addSourceStats(result, []portainer.SourceID{1}, []portainer.EndpointID{10, 20})
	addSourceStats(result, []portainer.SourceID{1}, []portainer.EndpointID{20, 30})

	require.Len(t, result[1].EndpointIDs, 3)
	require.True(t, result[1].EndpointIDs[10])
	require.True(t, result[1].EndpointIDs[20])
	require.True(t, result[1].EndpointIDs[30])
}

func TestAddSourceStats_MultipleSourceIDs(t *testing.T) {
	t.Parallel()

	result := make(map[portainer.SourceID]SourceStats)
	addSourceStats(result, []portainer.SourceID{1, 2}, []portainer.EndpointID{10})

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
		items, err = FetchWorkflows(tx, nil, adminContext(), nil)
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
		items, err = FetchWorkflows(tx, nil, adminContext(), set.ToSet([]portainer.EndpointID{1, 2}))
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
		items, err = FetchWorkflows(tx, nil, adminContext(), nil)
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
		items, err = FetchWorkflows(tx, nil, adminContext(), nil)
		return err
	}))
	require.Len(t, items, 3)
}

func TestFetchWorkflows_GroupsMultipleArtifactsUnderOneWorkflow(t *testing.T) {
	t.Parallel()
	_, store := datastore.MustNewTestStore(t, false, true)

	require.NoError(t, store.UpdateTx(func(tx dataservices.DataStoreTx) error {
		src := &portainer.Source{Type: portainer.SourceTypeGit, Git: &gittypes.GitSource{URL: "https://github.com/x/repo"}}
		require.NoError(t, tx.Source().Create(adminUserContext, src))

		wf := &portainer.Workflow{Name: "multi", Artifacts: []portainer.Artifact{
			{StackID: 1, Files: []portainer.ArtifactFile{{SourceID: src.ID}}},
			{StackID: 2, Files: []portainer.ArtifactFile{{SourceID: src.ID}}},
		}}
		require.NoError(t, tx.Workflow().Create(wf))

		require.NoError(t, tx.Stack().Create(&portainer.Stack{ID: 1, Name: "stack-a", WorkflowID: wf.ID}))
		require.NoError(t, tx.Stack().Create(&portainer.Stack{ID: 2, Name: "stack-b", WorkflowID: wf.ID}))

		return tx.User().Create(&portainer.User{ID: 1, Role: portainer.AdministratorRole})
	}))

	var items []Workflow
	require.NoError(t, store.ViewTx(func(tx dataservices.DataStoreTx) error {
		var err error
		items, err = FetchWorkflows(tx, nil, adminContext(), nil)
		return err
	}))

	require.Len(t, items, 1)
	require.Equal(t, "multi", items[0].Name)
	require.Len(t, items[0].Artifacts, 2)

	names := []string{items[0].Artifacts[0].Name, items[0].Artifacts[1].Name}
	require.Contains(t, names, "stack-a")
	require.Contains(t, names, "stack-b")
}

func TestFetchWorkflows_ShowsWorkflowWithNoArtifacts(t *testing.T) {
	t.Parallel()
	_, store := datastore.MustNewTestStore(t, false, true)

	require.NoError(t, store.UpdateTx(func(tx dataservices.DataStoreTx) error {
		require.NoError(t, tx.Workflow().Create(&portainer.Workflow{Name: "empty"}))

		return tx.User().Create(&portainer.User{ID: 1, Role: portainer.AdministratorRole})
	}))

	var items []Workflow
	require.NoError(t, store.ViewTx(func(tx dataservices.DataStoreTx) error {
		var err error
		items, err = FetchWorkflows(tx, nil, adminContext(), nil)
		return err
	}))

	require.Len(t, items, 1)
	require.Equal(t, "empty", items[0].Name)
	require.Empty(t, items[0].Artifacts)
}

func TestFetchWorkflows_HidesWorkflowWhenAllArtifactsFiltered(t *testing.T) {
	t.Parallel()
	_, store := datastore.MustNewTestStore(t, false, true)

	require.NoError(t, store.UpdateTx(func(tx dataservices.DataStoreTx) error {
		// A workflow whose only artifact references a stack that does not exist:
		// the artifact is filtered out, so the workflow must be hidden.
		wf := &portainer.Workflow{Name: "dangling", Artifacts: []portainer.Artifact{
			{StackID: 999, Files: []portainer.ArtifactFile{{SourceID: 1}}},
		}}
		require.NoError(t, tx.Workflow().Create(wf))

		return tx.User().Create(&portainer.User{ID: 1, Role: portainer.AdministratorRole})
	}))

	var items []Workflow
	require.NoError(t, store.ViewTx(func(tx dataservices.DataStoreTx) error {
		var err error
		items, err = FetchWorkflows(tx, nil, adminContext(), nil)
		return err
	}))

	require.Empty(t, items)
}

func TestFetchWorkflows_HidesEmptyWorkflowWhenEndpointFilterActive(t *testing.T) {
	t.Parallel()
	_, store := datastore.MustNewTestStore(t, false, true)

	require.NoError(t, store.UpdateTx(func(tx dataservices.DataStoreTx) error {
		require.NoError(t, tx.Workflow().Create(&portainer.Workflow{Name: "empty"}))

		return tx.User().Create(&portainer.User{ID: 1, Role: portainer.AdministratorRole})
	}))

	var items []Workflow
	require.NoError(t, store.ViewTx(func(tx dataservices.DataStoreTx) error {
		var err error
		items, err = FetchWorkflows(tx, nil, adminContext(), set.ToSet([]portainer.EndpointID{1}))
		return err
	}))

	require.Empty(t, items)
}

func TestFetchSourceStats_TracksWorkflowCountAndEndpoints(t *testing.T) {
	t.Parallel()
	_, store := datastore.MustNewTestStore(t, false, true)

	var srcID portainer.SourceID

	require.NoError(t, store.UpdateTx(func(tx dataservices.DataStoreTx) error {
		src := &portainer.Source{Name: "shared", Type: portainer.SourceTypeGit, Git: &gittypes.GitSource{URL: "http://github.com/org/repo"}}
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
		stats, err = FetchSourceStats(tx, nil, adminContext())

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
		src := &portainer.Source{Name: "unused", Type: portainer.SourceTypeGit, Git: &gittypes.GitSource{URL: "http://github.com/org/repo"}}
		require.NoError(t, tx.Source().Create(adminUserContext, src))
		unusedID = src.ID

		return tx.User().Create(&portainer.User{ID: 1, Role: portainer.AdministratorRole})
	}))

	var stats map[portainer.SourceID]SourceStats
	require.NoError(t, store.ViewTx(func(tx dataservices.DataStoreTx) error {
		var err error
		stats, err = FetchSourceStats(tx, nil, adminContext())

		return err
	}))

	st := stats[unusedID]
	require.Zero(t, st.WorkflowCount)
	require.Empty(t, st.EndpointIDs)
}
