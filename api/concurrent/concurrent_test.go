package concurrent

import (
	"context"
	"errors"
	"sync/atomic"
	"testing"
	"testing/synctest"
	"time"

	"github.com/stretchr/testify/require"
)

func TestRun_AllSucceed(t *testing.T) {
	t.Parallel()

	fn1 := func(ctx context.Context) (any, error) { return "one", nil }
	fn2 := func(ctx context.Context) (any, error) { return "two", nil }
	fn3 := func(ctx context.Context) (any, error) { return "three", nil }

	results, err := Run(t.Context(), 0, fn1, fn2, fn3)

	require.NoError(t, err)
	require.Len(t, results, 3)

	values := make([]string, 0, len(results))
	for _, r := range results {
		values = append(values, r.Result.(string))
	}
	require.ElementsMatch(t, []string{"one", "two", "three"}, values)
}

func TestRun_OneError(t *testing.T) {
	t.Parallel()

	sentinel := errors.New("task failed")

	fn1 := func(ctx context.Context) (any, error) { return "ok", nil }
	fn2 := func(ctx context.Context) (any, error) { return nil, sentinel }

	_, err := Run(t.Context(), 0, fn1, fn2)

	require.ErrorIs(t, err, sentinel)
}

func TestRun_NoTasks(t *testing.T) {
	t.Parallel()

	results, err := Run(t.Context(), 0)

	require.NoError(t, err)
	require.Empty(t, results)
}

func TestRun_MaxConcurrency(t *testing.T) {
	t.Parallel()

	const numTasks = 10
	var peak atomic.Int32
	var active atomic.Int32

	task := func(ctx context.Context) (any, error) {
		current := active.Add(1)
		if current > peak.Load() {
			peak.Store(current)
		}

		time.Sleep(10 * time.Millisecond)
		active.Add(-1)

		return nil, nil
	}

	tasks := make([]Func, numTasks)
	for i := range tasks {
		tasks[i] = task
	}

	synctest.Test(t, func(t *testing.T) {
		results, err := Run(t.Context(), 3, tasks...)
		require.NoError(t, err)
		require.Len(t, results, numTasks)
		require.LessOrEqual(t, peak.Load(), int32(3))
	})
}

func TestRun_ZeroConcurrencyUsesAllTasks(t *testing.T) {
	t.Parallel()

	const numTasks = 5
	var peak atomic.Int32
	var active atomic.Int32

	task := func(ctx context.Context) (any, error) {
		current := active.Add(1)
		if current > peak.Load() {
			peak.Store(current)
		}

		time.Sleep(20 * time.Millisecond)
		active.Add(-1)

		return nil, nil
	}

	tasks := make([]Func, numTasks)
	for i := range tasks {
		tasks[i] = task
	}

	synctest.Test(t, func(t *testing.T) {
		results, err := Run(t.Context(), 0, tasks...)
		require.NoError(t, err)
		require.Len(t, results, numTasks)
		require.Equal(t, int32(numTasks), peak.Load())
	})
}

func TestRun_ContextCancelledBeforeStart(t *testing.T) {
	t.Parallel()

	ctx, cancel := context.WithCancel(t.Context())
	cancel()

	called := atomic.Bool{}
	fn := func(ctx context.Context) (any, error) {
		called.Store(true)
		return nil, ctx.Err()
	}

	_, err := Run(ctx, 1, fn, fn, fn)
	require.Error(t, err)
}

func TestRun_ContextPassedToTasks(t *testing.T) {
	t.Parallel()

	type key struct{}
	ctx := context.WithValue(t.Context(), key{}, "testvalue")

	fn := func(ctx context.Context) (any, error) {
		return ctx.Value(key{}), nil
	}

	results, err := Run(ctx, 0, fn)

	require.NoError(t, err)
	require.Equal(t, "testvalue", results[0].Result)
}
