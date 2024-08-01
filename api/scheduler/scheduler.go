package scheduler

import (
	"context"
	"strconv"
	"sync"
	"time"

	"github.com/pkg/errors"
	"github.com/robfig/cron/v3"
	"github.com/rs/zerolog/log"
)

type Scheduler struct {
	crontab    *cron.Cron
	activeJobs map[cron.EntryID]context.CancelFunc
	mu         sync.Mutex
}

type PermanentError struct {
	err error
}

func NewPermanentError(err error) *PermanentError {
	return &PermanentError{err: err}
}

func (e *PermanentError) Error() string {
	return e.err.Error()
}

func NewScheduler(ctx context.Context) *Scheduler {
	crontab := cron.New(cron.WithChain(cron.Recover(cron.DefaultLogger)))
	crontab.Start()

	s := &Scheduler{
		crontab:    crontab,
		activeJobs: make(map[cron.EntryID]context.CancelFunc),
	}

	if ctx != nil {
		go func() {
			<-ctx.Done()
			s.Shutdown()
		}()
	}

	return s
}

// Shutdown stops the scheduler and waits for it to stop if it is running; otherwise does nothing.
func (s *Scheduler) Shutdown() error {
	if s.crontab == nil {
		return nil
	}

	log.Debug().Msg("stopping scheduler")
	ctx := s.crontab.Stop()
	<-ctx.Done()

	s.mu.Lock()
	for _, job := range s.crontab.Entries() {
		if cancel, ok := s.activeJobs[job.ID]; ok {
			cancel()
		}
	}
	s.mu.Unlock()

	err := ctx.Err()
	if errors.Is(err, context.Canceled) {
		return nil
	}
	return err
}

// StopJob stops the job from being run in the future
func (s *Scheduler) StopJob(jobID string) error {
	id, err := strconv.Atoi(jobID)
	if err != nil {
		return errors.Wrapf(err, "failed convert jobID %q to int", jobID)
	}
	entryID := cron.EntryID(id)

	s.mu.Lock()
	if cancel, ok := s.activeJobs[entryID]; ok {
		cancel()
		delete(s.activeJobs, entryID)
	}
	s.mu.Unlock()

	return nil
}

// StartJobEvery schedules a new periodic job with a given duration.
// Returns job id that could be used to stop the given job.
// When job run returns an error, that job won't be run again.
func (s *Scheduler) StartJobEvery(duration time.Duration, job func() error) string {
	entryID := new(cron.EntryID)

	cancelFn := func() {
		log.Debug().Msg("job cancelled, stopping")
		s.crontab.Remove(*entryID)
	}

	jobFn := cron.FuncJob(func() {
		err := job()
		if err == nil {
			return
		}

		var permErr *PermanentError
		if errors.As(err, &permErr) {
			log.Error().Err(permErr).Msg("job returned a permanent error, it will be stopped")
			cancelFn()

			return
		}

		log.Error().Err(err).Msg("job returned an error, it will be rescheduled")
	})

	*entryID = s.crontab.Schedule(cron.Every(duration), jobFn)

	s.mu.Lock()
	s.activeJobs[*entryID] = cancelFn
	s.mu.Unlock()

	return strconv.Itoa(int(*entryID))
}
