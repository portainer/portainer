package scheduling

import (
	"context"
	"errors"
	"os"
	"strconv"
	"sync"
	"sync/atomic"
	"testing"
	"testing/synctest"
	"time"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices/source"
	"github.com/portainer/portainer/api/datastore"
	"github.com/portainer/portainer/api/filesystem"
	gittypes "github.com/portainer/portainer/api/git/types"
	"github.com/portainer/portainer/api/git/update"
	"github.com/portainer/portainer/api/scheduler"
	httperror "github.com/portainer/portainer/pkg/libhttp/error"

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

// TestSourceScheduler_TickSkipsArtifactWithMissingBacking covers BE-13300: a stack that was
// deleted through a path that skipped workflow cleanup leaves a dangling Artifact behind. tick
// must not attempt to deploy it (that's the source of the "stack redeploy failed: object not
// found" log spam).
func TestSourceScheduler_TickSkipsArtifactWithMissingBacking(t *testing.T) {
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

	err = store.Workflow().Create(&portainer.Workflow{
		Name: "wf-orphan",
		Artifacts: []portainer.Artifact{
			{StackID: 999, Files: []portainer.ArtifactFile{{SourceID: src.ID}}},
		},
	})
	require.NoError(t, err)

	err = store.Workflow().Create(&portainer.Workflow{
		Name: "wf-live",
		Artifacts: []portainer.Artifact{
			{StackID: 11, Files: []portainer.ArtifactFile{{SourceID: src.ID}}},
		},
	})
	require.NoError(t, err)

	var mu sync.Mutex
	var stacks []portainer.StackID

	sched := scheduler.NewScheduler(t.Context())
	poller := NewSourceScheduler(sched, store, Deployers{
		Stack: func(_ context.Context, id portainer.StackID) error {
			mu.Lock()
			defer mu.Unlock()
			stacks = append(stacks, id)

			return nil
		},
		StackExists: func(id portainer.StackID) (bool, error) {
			return id != 999, nil
		},
	})

	err = poller.tick(t.Context(), src.ID)
	require.NoError(t, err)

	require.ElementsMatch(t, []portainer.StackID{11}, stacks)
}

// TestSourceScheduler_ReconcileStopsWhenOnlyOrphanedArtifactsReference covers BE-13300: once
// every artifact referencing a source has a dangling StackID/EdgeStackID, the source's poll job
// must be stopped rather than kept alive forever.
// TestSourceScheduler_TickLogsAndContinuesWhenBackingCheckErrors covers the case where the
// existence check itself fails (as opposed to reporting the target missing): the artifact must be
// skipped, and other artifacts in the same tick must still be deployed.
func TestSourceScheduler_TickLogsAndContinuesWhenBackingCheckErrors(t *testing.T) {
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

	err = store.Workflow().Create(&portainer.Workflow{
		Name: "wf-erroring",
		Artifacts: []portainer.Artifact{
			{StackID: 13, Files: []portainer.ArtifactFile{{SourceID: src.ID}}},
		},
	})
	require.NoError(t, err)

	err = store.Workflow().Create(&portainer.Workflow{
		Name: "wf-live",
		Artifacts: []portainer.Artifact{
			{StackID: 11, Files: []portainer.ArtifactFile{{SourceID: src.ID}}},
		},
	})
	require.NoError(t, err)

	var mu sync.Mutex
	var stacks []portainer.StackID

	sched := scheduler.NewScheduler(t.Context())
	poller := NewSourceScheduler(sched, store, Deployers{
		Stack: func(_ context.Context, id portainer.StackID) error {
			mu.Lock()
			defer mu.Unlock()
			stacks = append(stacks, id)

			return nil
		},
		StackExists: func(id portainer.StackID) (bool, error) {
			if id == 13 {
				return false, errors.New("boom")
			}

			return true, nil
		},
	})

	err = poller.tick(t.Context(), src.ID)
	require.NoError(t, err)

	require.ElementsMatch(t, []portainer.StackID{11}, stacks)
}

// TestSourceScheduler_SourceReferencedPropagatesBackingCheckError covers sourceReferenced's error
// path: a failure checking one artifact's backing target must abort the reference check rather
// than being treated as "not referenced".
func TestSourceScheduler_SourceReferencedPropagatesBackingCheckError(t *testing.T) {
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

	err = store.Workflow().Create(&portainer.Workflow{
		Name: "wf-erroring",
		Artifacts: []portainer.Artifact{
			{StackID: 13, Files: []portainer.ArtifactFile{{SourceID: src.ID}}},
		},
	})
	require.NoError(t, err)

	wantErr := errors.New("boom")

	sched := scheduler.NewScheduler(t.Context())
	poller := NewSourceScheduler(sched, store, Deployers{
		StackExists: func(portainer.StackID) (bool, error) {
			return false, wantErr
		},
	})

	_, err = poller.sourceReferenced(src.ID)
	require.ErrorIs(t, err, wantErr)
}

// TestSourceScheduler_ArtifactBackingExistsUsesEdgeStackExistsOverride covers
// artifactBackingExists's EdgeStackExists override: when it is supplied, it must be used instead
// of the default assume-exists closure.
func TestSourceScheduler_ArtifactBackingExistsUsesEdgeStackExistsOverride(t *testing.T) {
	t.Parallel()

	_, store := datastore.MustNewTestStore(t, false, true)

	sched := scheduler.NewScheduler(t.Context())
	poller := NewSourceScheduler(sched, store, Deployers{
		EdgeStackExists: func(id portainer.EdgeStackID) (bool, error) {
			return id != 999, nil
		},
	})

	exists, err := poller.artifactBackingExists(portainer.Artifact{EdgeStackID: 999})
	require.NoError(t, err)
	require.False(t, exists)
}

func TestSourceScheduler_ReconcileStopsWhenOnlyOrphanedArtifactsReference(t *testing.T) {
	t.Parallel()

	_, store := datastore.MustNewTestStore(t, false, true)

	sysCtx := source.InsecureNewAdminContext()

	src := &portainer.Source{
		Name:     "orphaned",
		Type:     portainer.SourceTypeGit,
		Git:      &gittypes.GitSource{URL: "https://example.com/repo.git"},
		Interval: "1h",
	}
	err := store.Source().Create(sysCtx, src)
	require.NoError(t, err)

	err = store.Workflow().Create(&portainer.Workflow{
		Name: "wf-orphan",
		Artifacts: []portainer.Artifact{
			{StackID: 999, Files: []portainer.ArtifactFile{{SourceID: src.ID}}},
		},
	})
	require.NoError(t, err)

	sched := scheduler.NewScheduler(t.Context())
	poller := NewSourceScheduler(sched, store, Deployers{
		Stack: func(_ context.Context, _ portainer.StackID) error { return nil },
		StackExists: func(id portainer.StackID) (bool, error) {
			return id != 999, nil
		},
	})

	err = poller.ReconcileAll()
	require.NoError(t, err)

	_, ok := poller.jobs[src.ID]
	require.False(t, ok)
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
	running := poller.running[src.ID]
	require.NotNil(t, running)

	// Changing the interval restarts the job with a fresh id, and the new job keeps the same
	// running flag so it cannot overlap a tick of the old job that is still in progress.
	src.Interval = "2h"
	err = store.Source().Update(sysCtx, src.ID, src)
	require.NoError(t, err)

	err = poller.Reconcile(src.ID)
	require.NoError(t, err)

	entry, ok = poller.jobs[src.ID]
	require.True(t, ok)
	require.Equal(t, "2h", entry.interval)
	require.NotEqual(t, firstJobID, entry.jobID)
	require.Same(t, running, poller.running[src.ID])

	// Clearing the interval stops the job.
	src.Interval = ""
	err = store.Source().Update(sysCtx, src.ID, src)
	require.NoError(t, err)

	err = poller.Reconcile(src.ID)
	require.NoError(t, err)

	_, ok = poller.jobs[src.ID]
	require.False(t, ok)

	// Clearing the interval keeps the running flag, since the source still exists.
	require.Same(t, running, poller.running[src.ID])

	// Deleting the source drops it.
	err = store.Source().Delete(sysCtx, src.ID)
	require.NoError(t, err)

	err = poller.Reconcile(src.ID)
	require.NoError(t, err)

	require.NotContains(t, poller.running, src.ID)
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

// A tick hands every artifact of the source the same TmpClones, so git work done through them is
// shared, and no temporary clone is left behind once the tick ends.
func TestSourceScheduler_TickSharesTmpClonesBetweenArtifacts(t *testing.T) {
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

	err = store.Workflow().Create(&portainer.Workflow{
		Name: "wf",
		Artifacts: []portainer.Artifact{
			{StackID: 11, Files: []portainer.ArtifactFile{{SourceID: src.ID}}},
			{StackID: 22, Files: []portainer.ArtifactFile{{SourceID: src.ID}}},
			{StackID: 33, Files: []portainer.ArtifactFile{{SourceID: src.ID}}},
		},
	})
	require.NoError(t, err)

	root := t.TempDir()
	req := update.RepoRequest{URL: "https://example.com/repo.git", ReferenceName: "refs/heads/main"}
	commits, clones := 0, 0

	sched := scheduler.NewScheduler(t.Context())
	poller := NewSourceScheduler(sched, store, Deployers{
		Stack: func(ctx context.Context, id portainer.StackID) error {
			tmpClones := update.TmpClonesFromContext(ctx)
			require.NotNil(t, tmpClones)

			hash, err := tmpClones.CommitID(req, func() (string, error) {
				commits++

				return "abc123", nil
			})
			require.NoError(t, err)

			toDir := filesystem.JoinPaths(root, strconv.Itoa(int(id)))
			err = tmpClones.Clone(req, hash, root, toDir, func(dst string) error {
				clones++

				return os.WriteFile(filesystem.JoinPaths(dst, "compose.yml"), []byte("services: {}"), 0o644)
			})
			require.NoError(t, err)

			return nil
		},
	})

	err = poller.tick(t.Context(), src.ID)
	require.NoError(t, err)

	require.Equal(t, 1, commits)
	require.Equal(t, 1, clones)

	for _, id := range []string{"11", "22", "33"} {
		require.FileExists(t, filesystem.JoinPaths(root, id, "compose.yml"))
	}

	entries, err := os.ReadDir(root)
	require.NoError(t, err)

	for _, e := range entries {
		require.NotContains(t, e.Name(), ".gitops-clone-")
	}
}

// A source with a single artifact has nothing to share, so its tick does not set up TmpClones and
// the artifact clones straight into its own folder.
func TestSourceScheduler_TickSkipsTmpClonesForSingleArtifact(t *testing.T) {
	t.Parallel()

	_, store := datastore.MustNewTestStore(t, false, true)

	sysCtx := source.InsecureNewAdminContext()

	src := &portainer.Source{
		Name: "single",
		Type: portainer.SourceTypeGit,
		Git:  &gittypes.GitSource{URL: "https://example.com/repo.git"},
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

	deployed := 0

	sched := scheduler.NewScheduler(t.Context())
	poller := NewSourceScheduler(sched, store, Deployers{
		Stack: func(ctx context.Context, _ portainer.StackID) error {
			deployed++
			require.Nil(t, update.TmpClonesFromContext(ctx))

			return nil
		},
	})

	err = poller.tick(t.Context(), src.ID)
	require.NoError(t, err)
	require.Equal(t, 1, deployed)
}

// TestSourceScheduler_ScheduledPollSkipsWhileRunning drives the real cron callback: a tick that is
// still deploying makes later ticks skip, even across an interval change, and the guard is released
// whether the deployment succeeds or fails.
func TestSourceScheduler_ScheduledPollSkipsWhileRunning(t *testing.T) {
	t.Parallel()

	_, store := datastore.MustNewTestStore(t, false, true)

	sysCtx := source.InsecureNewAdminContext()

	src := &portainer.Source{
		Name:     "polled",
		Type:     portainer.SourceTypeGit,
		Git:      &gittypes.GitSource{URL: "https://example.com/repo.git"},
		Interval: "1s",
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

	synctest.Test(t, func(t *testing.T) {
		var calls atomic.Int32
		results := make(chan error)

		sched := scheduler.NewScheduler(t.Context())
		defer func() {
			err := sched.Shutdown()
			require.NoError(t, err)
		}()

		poller := NewSourceScheduler(sched, store, Deployers{
			Stack: func(_ context.Context, _ portainer.StackID) error {
				calls.Add(1)

				return <-results
			},
		})

		err := poller.ReconcileAll()
		require.NoError(t, err)

		// The first tick starts and blocks inside the deployer.
		time.Sleep(time.Second)
		synctest.Wait()
		require.EqualValues(t, 1, calls.Load())

		// Further ticks are skipped, including those of the job restarted by an interval change.
		src.Interval = "2s"
		err = store.Source().Update(sysCtx, src.ID, src)
		require.NoError(t, err)

		err = poller.Reconcile(src.ID)
		require.NoError(t, err)

		time.Sleep(10 * time.Second)
		synctest.Wait()
		require.EqualValues(t, 1, calls.Load())

		// Each way a deployment can finish releases the guard, so polling resumes.
		finish := func(deployErr error, wantCalls int32) {
			t.Helper()

			results <- deployErr

			time.Sleep(2 * time.Second)
			synctest.Wait()
			require.Equal(t, wantCalls, calls.Load())
		}

		// Success
		finish(nil, 2)

		// Handler error wrapping a cause
		finish(httperror.InternalServerError("failed in git auto update", errors.New("rate limited")), 3)

		// Plain error
		finish(errors.New("boom"), 4)

		// Let the last tick complete so shutdown does not wait on it
		results <- nil

		synctest.Wait()
	})
}
