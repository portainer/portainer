package scheduler

import (
	"sync"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	"github.com/rs/zerolog/log"
)

type JobScheduler struct {
	scheduler *Scheduler
	datastore dataservices.DataStore
	mu        sync.Mutex
	backupJobs      map[portainer.BackupScheduleID]string
	replicationJobs map[portainer.ReplicationScheduleID]string
}

func NewJobScheduler(scheduler *Scheduler, datastore dataservices.DataStore) *JobScheduler {
	return &JobScheduler{
		scheduler:       scheduler,
		datastore:       datastore,
		backupJobs:      make(map[portainer.BackupScheduleID]string),
		replicationJobs: make(map[portainer.ReplicationScheduleID]string),
	}
}

func (s *JobScheduler) ScheduleBackupJobs() error {
	schedules, err := s.datastore.BackupSchedule().ReadAll()
	if err != nil {
		return err
	}

	s.mu.Lock()
	defer s.mu.Unlock()

	for _, schedule := range schedules {
		if _, exists := s.backupJobs[schedule.ID]; exists {
			continue
		}

		jobID, err := s.scheduleBackup(schedule)
		if err != nil {
			log.Error().Err(err).Str("schedule", schedule.Name).Msg("Failed to schedule backup job")
			continue
		}
		s.backupJobs[schedule.ID] = jobID
	}

	return nil
}

func (s *JobScheduler) scheduleBackup(schedule portainer.BackupSchedule) (string, error) {
	job := func() error {
		log.Info().Str("schedule", schedule.Name).Msg("Executing backup job")
		// Actual backup logic would go here
		return nil
	}

	return s.scheduler.AddJob(schedule.Schedule, job)
}

func (s *JobScheduler) CreateBackupSchedule(schedule portainer.BackupSchedule) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	jobID, err := s.scheduleBackup(schedule)
	if err != nil {
		return err
	}
	s.backupJobs[schedule.ID] = jobID
	return nil
}

func (s *JobScheduler) UpdateBackupSchedule(schedule portainer.BackupSchedule) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	if jobID, ok := s.backupJobs[schedule.ID]; ok {
		s.scheduler.StopJob(jobID)
	}

	jobID, err := s.scheduleBackup(schedule)
	if err != nil {
		return err
	}
	s.backupJobs[schedule.ID] = jobID
	return nil
}

func (s *JobScheduler) DeleteBackupSchedule(id portainer.BackupScheduleID) {
	s.mu.Lock()
	defer s.mu.Unlock()

	if jobID, ok := s.backupJobs[id]; ok {
		s.scheduler.StopJob(jobID)
		delete(s.backupJobs, id)
	}
}

func (s *JobScheduler) ScheduleReplicationJobs() error {
	schedules, err := s.datastore.ReplicationSchedule().ReadAll()
	if err != nil {
		return err
	}

	s.mu.Lock()
	defer s.mu.Unlock()

	for _, schedule := range schedules {
		if _, exists := s.replicationJobs[schedule.ID]; exists {
			continue
		}

		jobID, err := s.scheduleReplication(schedule)
		if err != nil {
			log.Error().Err(err).Str("schedule", schedule.Name).Msg("Failed to schedule replication job")
			continue
		}
		s.replicationJobs[schedule.ID] = jobID
	}

	return nil
}

func (s *JobScheduler) scheduleReplication(schedule portainer.ReplicationSchedule) (string, error) {
	job := func() error {
		log.Info().Str("schedule", schedule.Name).Msg("Executing replication job")
		// Actual replication logic would go here
		return nil
	}

	return s.scheduler.AddJob(schedule.Schedule, job)
}

func (s *JobScheduler) CreateReplicationSchedule(schedule portainer.ReplicationSchedule) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	jobID, err := s.scheduleReplication(schedule)
	if err != nil {
		return err
	}
	s.replicationJobs[schedule.ID] = jobID
	return nil
}

func (s *JobScheduler) UpdateReplicationSchedule(schedule portainer.ReplicationSchedule) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	if jobID, ok := s.replicationJobs[schedule.ID]; ok {
		s.scheduler.StopJob(jobID)
	}

	jobID, err := s.scheduleReplication(schedule)
	if err != nil {
		return err
	}
	s.replicationJobs[schedule.ID] = jobID
	return nil
}

func (s *JobScheduler) DeleteReplicationSchedule(id portainer.ReplicationScheduleID) {
	s.mu.Lock()
	defer s.mu.Unlock()

	if jobID, ok := s.replicationJobs[id]; ok {
		s.scheduler.StopJob(jobID)
		delete(s.replicationJobs, id)
	}
}
