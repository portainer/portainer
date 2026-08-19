package schedule

import (
	"context"
	"sync/atomic"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
)

// run starts RunOnInterval in a goroutine and returns a channel that closes
// when RunOnInterval returns.
func run(ctx context.Context, interval time.Duration, fn func(), cleanup func()) <-chan struct{} {
	done := make(chan struct{})

	go func() {
		RunOnInterval(ctx, interval, fn, cleanup)
		close(done)
	}()

	return done
}

func TestRunOnInterval_CallsFnOnTick(t *testing.T) {
	t.Parallel()
	var calls atomic.Int32

	run(t.Context(), time.Millisecond, func() { calls.Add(1) }, nil)

	assert.Eventually(t, func() bool {
		return calls.Load() >= 3
	}, time.Second, time.Millisecond)
}

func TestRunOnInterval_StopsWhenContextCancelled(t *testing.T) {
	t.Parallel()
	ctx, cancel := context.WithCancel(t.Context())
	cancel()

	done := run(ctx, time.Hour, func() {}, nil)

	select {
	case <-done:
	case <-time.After(time.Second):
		t.Fatal("RunOnInterval did not return after context cancellation")
	}
}

func TestRunOnInterval_CallsCleanupOnCancellation(t *testing.T) {
	t.Parallel()
	ctx, cancel := context.WithCancel(t.Context())

	var cleanupCalled atomic.Bool
	done := run(ctx, time.Hour, func() {}, func() { cleanupCalled.Store(true) })

	cancel()
	<-done

	assert.True(t, cleanupCalled.Load())
}

func TestRunOnInterval_CleanupCalledExactlyOnce(t *testing.T) {
	t.Parallel()
	ctx, cancel := context.WithCancel(t.Context())

	var cleanupCount atomic.Int32
	done := run(ctx, time.Millisecond, func() {}, func() { cleanupCount.Add(1) })

	// Let fn tick a few times before cancelling.
	assert.Eventually(t, func() bool { return cleanupCount.Load() == 0 }, time.Second, time.Millisecond)
	cancel()
	<-done

	assert.Equal(t, int32(1), cleanupCount.Load())
}

func TestRunOnInterval_NilCleanupDoesNotPanic(t *testing.T) {
	t.Parallel()
	ctx, cancel := context.WithCancel(t.Context())
	cancel()

	done := run(ctx, time.Hour, func() {}, nil)

	select {
	case <-done:
	case <-time.After(time.Second):
		t.Fatal("RunOnInterval did not return after context cancellation")
	}
}

func TestRunOnInterval_FnNotCalledAfterCancellation(t *testing.T) {
	t.Parallel()
	ctx, cancel := context.WithCancel(t.Context())
	cancel()

	var calls atomic.Int32
	done := run(ctx, time.Millisecond, func() { calls.Add(1) }, nil)
	<-done

	assert.Equal(t, int32(0), calls.Load())
}
