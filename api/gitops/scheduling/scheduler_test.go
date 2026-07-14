package scheduling

import (
	"context"
	"sync"
	"testing"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices/source"
	"github.com/portainer/portainer/api/datastore"
	gittypes "github.com/portainer/portainer/api/git/types"
	"github.com/portainer/portainer/api/scheduler"

	"github.com/stretchr/testify/require"
)

func TestSourceScheduler_TickDeploysAllReferencingArtifacts(t *testing.T) {
	t.Parallel()

	_, store := datastore.MustNewTestStore(t, false, true)

	sysCtx := source.InsecureNewAdminContext()

	src := &portainer.Source{
		Name: "shared",
		Type: portainer.SourceTypeGit,
		Git:  &gittypes.GitSource{URL: "https://example.com/repo.git"},
	}
	err := store.Source().Create(sysCtx, src)
	require.NoError(t, err)

	otherSrc := &portainer.Source{
		Name: "other",
		Type: portainer.SourceTypeGit,
		Git:  &gittypes.GitSource{URL: "https://example.com/other.git"},
	}
	err = store.Source().Create(sysCtx, otherSrc)
	require.NoError(t, err)

	// Two stacks and one edge stack reference the shared source across separate workflows.
	err = store.Workflow().Create(&portainer.Workflow{
		Name: "wf-stack-1",
		Artifacts: []portainer.Artifact{
			{StackID: 11, Files: []portainer.ArtifactFile{{SourceID: src.ID}}},
		},
	})
	require.NoError(t, err)

	err = store.Workflow().Create(&portainer.Workflow{
		Name: "wf-stack-2",
		Artifacts: []portainer.Artifact{
			{StackID: 22, Files: []portainer.ArtifactFile{{SourceID: src.ID}}},
		},
	})
	require.NoError(t, err)

	err = store.Workflow().Create(&portainer.Workflow{
		Name: "wf-edge",
		Artifacts: []portainer.Artifact{
			{EdgeStackID: 33, Files: []portainer.ArtifactFile{{SourceID: src.ID}}},
		},
	})
	require.NoError(t, err)

	// A workflow that only references the other source must not be touched.
	err = store.Workflow().Create(&portainer.Workflow{
		Name: "wf-unrelated",
		Artifacts: []portainer.Artifact{
			{StackID: 99, Files: []portainer.ArtifactFile{{SourceID: otherSrc.ID}}},
		},
	})
	require.NoError(t, err)

	var mu sync.Mutex
	var stacks []portainer.StackID
	var edgeStacks []portainer.EdgeStackID

	sched := scheduler.NewScheduler(t.Context())
	poller := NewSourceScheduler(sched, store, Deployers{
		Stack: func(_ context.Context, id portainer.StackID) error {
			mu.Lock()
			defer mu.Unlock()
			stacks = append(stacks, id)

			return nil
		},
		EdgeStack: func(_ context.Context, id portainer.EdgeStackID) error {
			mu.Lock()
			defer mu.Unlock()
			edgeStacks = append(edgeStacks, id)

			return nil
		},
	})

	err = poller.tick(t.Context(), src.ID)
	require.NoError(t, err)

	require.ElementsMatch(t, []portainer.StackID{11, 22}, stacks)
	require.ElementsMatch(t, []portainer.EdgeStackID{33}, edgeStacks)
}

func TestSourceScheduler_ReconcileStartsRestartsAndStops(t *testing.T) {
	t.Parallel()

	_, store := datastore.MustNewTestStore(t, false, true)

	sysCtx := source.InsecureNewAdminContext()

	// A long interval keeps the cron job from ever firing during the test; we only assert job state.
	src := &portainer.Source{
		Name:     "polled",
		Type:     portainer.SourceTypeGit,
		Git:      &gittypes.GitSource{URL: "https://example.com/repo.git"},
		Interval: "1h",
	}
	err := store.Source().Create(sysCtx, src)
	require.NoError(t, err)

	err = store.Workflow().Create(&portainer.Workflow{
		Name: "wf",
		Artifacts: []portainer.Artifact{
			{StackID: 11, Files: []portainer.ArtifactFile{{SourceID: src.ID}}},
		},
	})
	require.NoError(t, err)

	sched := scheduler.NewScheduler(t.Context())
	poller := NewSourceScheduler(sched, store, Deployers{
		Stack: func(_ context.Context, _ portainer.StackID) error { return nil },
	})

	// A referenced source with an interval gets a job.
	err = poller.ReconcileAll()
	require.NoError(t, err)

	entry, ok := poller.jobs[src.ID]
	require.True(t, ok)
	require.Equal(t, "1h", entry.interval)
	firstJobID := entry.jobID

	// Changing the interval restarts the job with a fresh id.
	src.Interval = "2h"
	err = store.Source().Update(sysCtx, src.ID, src)
	require.NoError(t, err)

	err = poller.Reconcile(src.ID)
	require.NoError(t, err)

	entry, ok = poller.jobs[src.ID]
	require.True(t, ok)
	require.Equal(t, "2h", entry.interval)
	require.NotEqual(t, firstJobID, entry.jobID)

	// Clearing the interval stops the job.
	src.Interval = ""
	err = store.Source().Update(sysCtx, src.ID, src)
	require.NoError(t, err)

	err = poller.Reconcile(src.ID)
	require.NoError(t, err)

	_, ok = poller.jobs[src.ID]
	require.False(t, ok)
}

func TestSourceScheduler_ReconcileSkipsUnreferencedSource(t *testing.T) {
	t.Parallel()

	_, store := datastore.MustNewTestStore(t, false, true)

	sysCtx := source.InsecureNewAdminContext()

	src := &portainer.Source{
		Name:     "orphan",
		Type:     portainer.SourceTypeGit,
		Git:      &gittypes.GitSource{URL: "https://example.com/repo.git"},
		Interval: "1h",
	}
	err := store.Source().Create(sysCtx, src)
	require.NoError(t, err)

	sched := scheduler.NewScheduler(t.Context())
	poller := NewSourceScheduler(sched, store, Deployers{
		Stack: func(_ context.Context, _ portainer.StackID) error { return nil },
	})

	err = poller.Reconcile(src.ID)
	require.NoError(t, err)

	_, ok := poller.jobs[src.ID]
	require.False(t, ok)
}
