package scheduling

import (
	"context"
	"sync"
	"testing"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/datastore"
	"github.com/portainer/portainer/api/scheduler"

	"github.com/stretchr/testify/require"
)

func TestStackScheduler_TickRestartsStack(t *testing.T) {
	t.Parallel()

	_, store := datastore.MustNewTestStore(t, false, true)

	stack := &portainer.Stack{
		ID:         11,
		Name:       "scheduled",
		Type:       portainer.DockerComposeStack,
		EndpointID: 1,
		RestartSchedule: &portainer.StackRestartSchedule{
			CronExpression: "0 2 * * *",
		},
	}
	require.NoError(t, store.Stack().Create(stack))

	var mu sync.Mutex
	var restarted []portainer.StackID

	sched := scheduler.NewScheduler(t.Context())
	stackScheduler := NewStackScheduler(sched, store, func(_ context.Context, stackID portainer.StackID) error {
		mu.Lock()
		defer mu.Unlock()
		restarted = append(restarted, stackID)

		return nil
	})

	require.NoError(t, stackScheduler.tick(t.Context(), stack.ID))

	require.Equal(t, []portainer.StackID{stack.ID}, restarted)
}

func TestStackScheduler_ReconcileStartsRestartsAndStops(t *testing.T) {
	t.Parallel()

	_, store := datastore.MustNewTestStore(t, false, true)

	stack := &portainer.Stack{
		ID:         12,
		Name:       "scheduled",
		Type:       portainer.DockerComposeStack,
		EndpointID: 1,
		RestartSchedule: &portainer.StackRestartSchedule{
			CronExpression: "0 2 * * *",
		},
	}
	require.NoError(t, store.Stack().Create(stack))

	sched := scheduler.NewScheduler(t.Context())
	stackScheduler := NewStackScheduler(sched, store, func(_ context.Context, _ portainer.StackID) error {
		return nil
	})

	require.NoError(t, stackScheduler.ReconcileAll())

	entry, ok := stackScheduler.jobs[stack.ID]
	require.True(t, ok)
	require.Equal(t, "0 2 * * *", entry.cronExpression)
	firstJobID := entry.jobID

	stack.RestartSchedule.CronExpression = "30 1 * * *"
	require.NoError(t, store.Stack().Update(stack.ID, stack))

	require.NoError(t, stackScheduler.Reconcile(stack.ID))

	entry, ok = stackScheduler.jobs[stack.ID]
	require.True(t, ok)
	require.Equal(t, "30 1 * * *", entry.cronExpression)
	require.NotEqual(t, firstJobID, entry.jobID)

	stack.RestartSchedule = nil
	require.NoError(t, store.Stack().Update(stack.ID, stack))

	require.NoError(t, stackScheduler.Reconcile(stack.ID))

	_, ok = stackScheduler.jobs[stack.ID]
	require.False(t, ok)
}

func TestStackScheduler_ReconcileSkipsUnsupportedStacks(t *testing.T) {
	t.Parallel()

	_, store := datastore.MustNewTestStore(t, false, true)

	stack := &portainer.Stack{
		ID:         13,
		Name:       "kube",
		Type:       portainer.KubernetesStack,
		EndpointID: 1,
		RestartSchedule: &portainer.StackRestartSchedule{
			CronExpression: "0 2 * * *",
		},
	}
	require.NoError(t, store.Stack().Create(stack))

	sched := scheduler.NewScheduler(t.Context())
	stackScheduler := NewStackScheduler(sched, store, func(_ context.Context, _ portainer.StackID) error {
		return nil
	})

	require.NoError(t, stackScheduler.Reconcile(stack.ID))

	_, ok := stackScheduler.jobs[stack.ID]
	require.False(t, ok)
}
