package scheduling

import (
	"context"
	"fmt"
	"strings"
	"sync"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	"github.com/portainer/portainer/api/scheduler"

	"github.com/rs/zerolog/log"
)

type Restarter func(ctx context.Context, stackID portainer.StackID) error

type dataStore interface {
	Stack() dataservices.StackService
}

type StackScheduler struct {
	scheduler *scheduler.Scheduler
	dataStore dataStore
	restarter Restarter

	mu   sync.Mutex
	jobs map[portainer.StackID]jobEntry
}

type jobEntry struct {
	jobID          string
	cronExpression string
}

func NewStackScheduler(s *scheduler.Scheduler, ds dataStore, restarter Restarter) *StackScheduler {
	return &StackScheduler{
		scheduler: s,
		dataStore: ds,
		restarter: restarter,
		jobs:      make(map[portainer.StackID]jobEntry),
	}
}

// ReconcileAll starts, updates, or stops every scheduled stack restart job.
func (s *StackScheduler) ReconcileAll() error {
	stacks, err := s.dataStore.Stack().ReadAll()
	if err != nil {
		return fmt.Errorf("failed to read stacks: %w", err)
	}

	for i := range stacks {
		if err := s.reconcileStack(&stacks[i]); err != nil {
			log.Warn().Err(err).Int("stack_id", int(stacks[i].ID)).Msg("failed to reconcile stack restart job")
		}
	}

	return nil
}

// Reconcile recomputes the desired scheduler state for a single stack.
func (s *StackScheduler) Reconcile(stackID portainer.StackID) error {
	if s == nil || stackID == 0 {
		return nil
	}

	stack, err := s.dataStore.Stack().Read(stackID)
	if err != nil {
		if dataservices.IsErrObjectNotFound(err) {
			s.stop(stackID)

			return nil
		}

		return fmt.Errorf("failed to read stack %d: %w", stackID, err)
	}

	return s.reconcileStack(stack)
}

func (s *StackScheduler) reconcileStack(stack *portainer.Stack) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	if !hasRestartSchedule(stack) {
		s.stopLocked(stack.ID)

		return nil
	}

	cronExpression := strings.TrimSpace(stack.RestartSchedule.CronExpression)
	if entry, ok := s.jobs[stack.ID]; ok {
		if entry.cronExpression == cronExpression {
			return nil
		}

		s.stopLocked(stack.ID)
	}

	stackID := stack.ID
	jobID, err := s.scheduler.StartJob(cronExpression, func() error {
		return s.tick(context.Background(), stackID)
	})
	if err != nil {
		return fmt.Errorf("invalid restart schedule for stack %d: %w", stack.ID, err)
	}

	s.jobs[stack.ID] = jobEntry{
		jobID:          jobID,
		cronExpression: cronExpression,
	}

	return nil
}

func (s *StackScheduler) stop(stackID portainer.StackID) {
	s.mu.Lock()
	defer s.mu.Unlock()

	s.stopLocked(stackID)
}

func (s *StackScheduler) stopLocked(stackID portainer.StackID) {
	entry, ok := s.jobs[stackID]
	if !ok {
		return
	}

	_ = s.scheduler.StopJob(entry.jobID)
	delete(s.jobs, stackID)
}

func (s *StackScheduler) tick(ctx context.Context, stackID portainer.StackID) error {
	if s.restarter == nil {
		return nil
	}

	return s.restarter(ctx, stackID)
}

func hasRestartSchedule(stack *portainer.Stack) bool {
	if stack == nil || stack.Type == portainer.KubernetesStack || stack.RestartSchedule == nil {
		return false
	}

	return strings.TrimSpace(stack.RestartSchedule.CronExpression) != ""
}
