package scheduler

import (
	"context"
	"errors"
	"fmt"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
)

var jobInterval = time.Second

func Test_ScheduledJobRuns(t *testing.T) {
	s := NewScheduler(context.Background())
	defer s.Shutdown()

	ctx, cancel := context.WithTimeout(context.Background(), 2*jobInterval)

	var workDone bool
	s.StartJobEvery(jobInterval, func() error {
		workDone = true

		cancel()
		return nil
	})

	<-ctx.Done()
	assert.True(t, workDone, "value should been set in the job")
}

func Test_JobCanBeStopped(t *testing.T) {
	s := NewScheduler(context.Background())
	defer s.Shutdown()

	ctx, cancel := context.WithTimeout(context.Background(), 2*jobInterval)

	var workDone bool
	jobID := s.StartJobEvery(jobInterval, func() error {
		workDone = true

		cancel()
		return nil
	})
	s.StopJob(jobID)

	<-ctx.Done()
	assert.False(t, workDone, "job shouldn't had a chance to run")
}

func Test_JobShouldStop_UponError(t *testing.T) {
	s := NewScheduler(context.Background())
	defer s.Shutdown()

	var acc int
	ch := make(chan struct{})
	s.StartJobEvery(jobInterval, func() error {
		acc++
		close(ch)
		return fmt.Errorf("failed")
	})

	<-time.After(3 * jobInterval)
	<-ch
	assert.Equal(t, 1, acc, "job stop after the first run because it returns an error")
}

func Test_CanTerminateAllJobs_ByShuttingDownScheduler(t *testing.T) {
	s := NewScheduler(context.Background())

	ctx, cancel := context.WithTimeout(context.Background(), 2*jobInterval)

	var workDone bool
	s.StartJobEvery(jobInterval, func() error {
		workDone = true

		cancel()
		return nil
	})

	s.Shutdown()

	<-ctx.Done()
	assert.False(t, workDone, "job shouldn't had a chance to run")
}

func Test_CanTerminateAllJobs_ByCancellingParentContext(t *testing.T) {
	ctx, cancel := context.WithTimeout(context.Background(), 2*jobInterval)
	s := NewScheduler(ctx)

	var workDone bool
	s.StartJobEvery(jobInterval, func() error {
		workDone = true

		cancel()
		return nil
	})

	cancel()

	<-ctx.Done()
	assert.False(t, workDone, "job shouldn't had a chance to run")
}

func Test_StartJobEvery_Concurrently(t *testing.T) {
	ctx, cancel := context.WithTimeout(context.Background(), 2*jobInterval)
	s := NewScheduler(ctx)

	f := func() error {
		return errors.New("error")
	}

	go s.StartJobEvery(jobInterval, f)
	s.StartJobEvery(jobInterval, f)

	cancel()

	<-ctx.Done()
}
