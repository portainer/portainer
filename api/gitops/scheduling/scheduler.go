package scheduling

import (
	"context"
	"fmt"
	"sync"
	"time"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	"github.com/portainer/portainer/api/dataservices/source"
	"github.com/portainer/portainer/api/gitops/workflows"
	"github.com/portainer/portainer/api/scheduler"

	"github.com/rs/zerolog/log"
)

type Deployers struct {
	Stack       func(ctx context.Context, stackID portainer.StackID) error
	StackExists func(stackID portainer.StackID) (bool, error)

	EdgeStack       func(ctx context.Context, edgeStackID portainer.EdgeStackID) error
	EdgeStackExists func(edgeStackID portainer.EdgeStackID) (bool, error)
}

type dataStore interface {
	Source() dataservices.SourceService
	Workflow() dataservices.WorkflowService
}

type SourceScheduler struct {
	scheduler *scheduler.Scheduler
	dataStore dataStore
	deployers Deployers

	mu   sync.Mutex
	jobs map[portainer.SourceID]jobEntry
}

type jobEntry struct {
	jobID    string
	interval string
}

func NewSourceScheduler(s *scheduler.Scheduler, ds dataStore, deployers Deployers) *SourceScheduler {
	return &SourceScheduler{
		scheduler: s,
		dataStore: ds,
		deployers: deployers,
		jobs:      make(map[portainer.SourceID]jobEntry),
	}
}

// ReconcileAll starts, updates, or stops the polling job of every source to match its current state.
func (s *SourceScheduler) ReconcileAll() error {
	sysCtx := source.InsecureNewAdminContext()

	sources, err := s.dataStore.Source().ReadAll(sysCtx)
	if err != nil {
		return fmt.Errorf("failed to read sources: %w", err)
	}

	for i := range sources {
		if err := s.reconcileSource(&sources[i]); err != nil {
			log.Warn().Err(err).Int("source_id", int(sources[i].ID)).Msg("failed to reconcile source polling job")
		}
	}

	return nil
}

// Reconcile recomputes the desired polling state for a single source: it starts a job when the
// source becomes pollable, restarts it when the interval changes, and stops it when the source is
// gone, has no interval, or is no longer referenced by any workflow.
//
// It is a no-op when called on a nil scheduler or with a zero sourceID, so callers do not need to
// guard every call site.
func (s *SourceScheduler) Reconcile(sourceID portainer.SourceID) error {
	if s == nil || sourceID == 0 {
		return nil
	}

	sysCtx := source.InsecureNewAdminContext()

	src, err := s.dataStore.Source().Read(sysCtx, sourceID)
	if err != nil {
		if dataservices.IsErrObjectNotFound(err) {
			s.stop(sourceID)

			return nil
		}

		return fmt.Errorf("failed to read source %d: %w", sourceID, err)
	}

	return s.reconcileSource(src)
}

func (s *SourceScheduler) reconcileSource(src *portainer.Source) error {
	referenced, err := s.sourceReferenced(src.ID)
	if err != nil {
		return err
	}

	s.mu.Lock()
	defer s.mu.Unlock()

	if src.Interval == "" || !referenced {
		s.stopLocked(src.ID)

		return nil
	}

	d, err := time.ParseDuration(src.Interval)
	if err != nil {
		return fmt.Errorf("invalid interval %q for source %d: %w", src.Interval, src.ID, err)
	}

	if entry, ok := s.jobs[src.ID]; ok {
		if entry.interval == src.Interval {
			return nil
		}

		s.stopLocked(src.ID)
	}

	sourceID := src.ID
	jobID := s.scheduler.StartJobEvery(d, func() error {
		return s.tick(context.Background(), sourceID)
	})
	s.jobs[src.ID] = jobEntry{jobID: jobID, interval: src.Interval}

	return nil
}

func (s *SourceScheduler) stop(sourceID portainer.SourceID) {
	s.mu.Lock()
	defer s.mu.Unlock()

	s.stopLocked(sourceID)
}

func (s *SourceScheduler) stopLocked(sourceID portainer.SourceID) {
	entry, ok := s.jobs[sourceID]
	if !ok {
		return
	}

	if err := s.scheduler.StopJob(entry.jobID); err != nil {
		log.Warn().Err(err).Int("source_id", int(sourceID)).Msg("failed to stop source polling job")
	}

	delete(s.jobs, sourceID)
}

// tick runs one poll of a source: it redeploys every artifact that references the source.
// Individual deploy failures are logged and do not abort the remaining work; each deployer
// persists the resulting source and artifact status itself. Artifacts whose backing stack or
// edge stack no longer exists (e.g. deleted through a path that didn't clean up the workflow) are
// skipped rather than deployed against a nonexistent target.
func (s *SourceScheduler) tick(ctx context.Context, sourceID portainer.SourceID) error {
	matchingWorkflows, err := s.dataStore.Workflow().ReadAll(func(wf portainer.Workflow) bool {
		return workflowReferencesSource(wf, sourceID)
	})
	if err != nil {
		return fmt.Errorf("failed to read workflows for source %d: %w", sourceID, err)
	}

	for _, wf := range matchingWorkflows {
		for _, a := range wf.Artifacts {
			if !artifactReferencesSource(a, sourceID) {
				continue
			}

			exists, err := s.artifactBackingExists(a)
			if err != nil {
				log.Warn().Err(err).Msg("source poll: failed to check artifact backing existence")

				continue
			}

			if !exists {
				continue
			}

			s.deployArtifact(ctx, a)
		}
	}

	return nil
}

func (s *SourceScheduler) deployArtifact(ctx context.Context, a portainer.Artifact) {
	if a.StackID != 0 && s.deployers.Stack != nil {
		if err := s.deployers.Stack(ctx, a.StackID); err != nil {
			log.Warn().Err(err).Int("stack_id", int(a.StackID)).Msg("source poll: stack redeploy failed")
		}
	}

	if a.EdgeStackID != 0 && s.deployers.EdgeStack != nil {
		if err := s.deployers.EdgeStack(ctx, a.EdgeStackID); err != nil {
			log.Warn().Err(err).Int("edge_stack_id", int(a.EdgeStackID)).Msg("source poll: edge stack redeploy failed")
		}
	}
}

// sourceReferenced reports whether any workflow artifact referencing sourceID still has a live
// backing stack or edge stack. An artifact left dangling by a delete path that skipped workflow
// cleanup no longer counts, so a fully-orphaned source's poll job gets stopped.
func (s *SourceScheduler) sourceReferenced(sourceID portainer.SourceID) (bool, error) {
	matchingWorkflows, err := s.dataStore.Workflow().ReadAll(func(wf portainer.Workflow) bool {
		return workflowReferencesSource(wf, sourceID)
	})
	if err != nil {
		return false, fmt.Errorf("failed to read workflows for source %d: %w", sourceID, err)
	}

	for _, wf := range matchingWorkflows {
		for _, a := range wf.Artifacts {
			if !artifactReferencesSource(a, sourceID) {
				continue
			}

			exists, err := s.artifactBackingExists(a)
			if err != nil {
				return false, err
			}

			if exists {
				return true, nil
			}
		}
	}

	return false, nil
}

// artifactBackingExists reports whether a's target stack or edge stack still exists, via the
// existence checks supplied in Deployers. An unset check assumes the target exists.
func (s *SourceScheduler) artifactBackingExists(a portainer.Artifact) (bool, error) {
	stackExists := func(portainer.StackID) (bool, error) { return true, nil }
	if s.deployers.StackExists != nil {
		stackExists = s.deployers.StackExists
	}

	edgeStackExists := func(portainer.EdgeStackID) (bool, error) { return true, nil }
	if s.deployers.EdgeStackExists != nil {
		edgeStackExists = s.deployers.EdgeStackExists
	}

	return workflows.ArtifactBackingExists(a, stackExists, edgeStackExists)
}

func workflowReferencesSource(wf portainer.Workflow, sourceID portainer.SourceID) bool {
	for _, a := range wf.Artifacts {
		if artifactReferencesSource(a, sourceID) {
			return true
		}
	}

	return false
}

func artifactReferencesSource(a portainer.Artifact, sourceID portainer.SourceID) bool {
	for _, f := range a.Files {
		if f.SourceID == sourceID {
			return true
		}
	}

	return false
}
