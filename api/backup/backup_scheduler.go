package backup

import (
	"context"
	"log"
	"time"

	"github.com/pkg/errors"
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/http/offlinegate"
	"github.com/robfig/cron/v3"
)

// BackupScheduler orchestrates S3 settings and active backup cron jobs
type BackupScheduler struct {
	cronmanager     *cron.Cron
	s3backupService portainer.S3BackupService
	gate            *offlinegate.OfflineGate
	datastore       portainer.DataStore
	filestorePath   string
}

func NewBackupScheduler(offlineGate *offlinegate.OfflineGate, datastore portainer.DataStore, filestorePath string) *BackupScheduler {
	crontab := cron.New(cron.WithChain(cron.Recover(cron.DefaultLogger)))
	s3backupService := datastore.S3Backup()

	return &BackupScheduler{
		cronmanager:     crontab,
		s3backupService: s3backupService,
		gate:            offlineGate,
		datastore:       datastore,
		filestorePath:   filestorePath,
	}
}

// Start fetches latest backup settings and starts cron job if configured
func (s *BackupScheduler) Start() error {
	s.cronmanager.Start()

	settings, err := s.s3backupService.GetSettings()
	if err != nil {
		return errors.Wrap(err, "failed to fetch settings")
	}

	if canBeScheduled(settings) {
		return s.startJob(settings)
	}

	return nil
}

// Stop stops the scheduler if it is running; otherwise it does nothing.
// A context is returned so the caller can wait for running jobs to complete.
func (s *BackupScheduler) Stop() context.Context {
	if s.cronmanager != nil {
		log.Println("[DEBUG] Stopping backup scheduler")
		return s.cronmanager.Stop()
	}

	return nil
}

// Update updates stored S3 backup settings and orchestrates cron jobs.
// When scheduler has an active cron job, then it shuts it down.
// When a provided settings has a cron, then starts a new cron job.
// When ever current cron is being shut down, last cron error going to be dropped.
func (s *BackupScheduler) Update(settings portainer.S3BackupSettings) error {

	if err := s.s3backupService.UpdateSettings(settings); err != nil {
		return errors.Wrap(err, "failed to update settings")
	}

	if err := s.stopJobs(); err != nil {
		return errors.Wrap(err, "failed to stop current cronjob")
	}

	if canBeScheduled(settings) {
		return s.startJob(settings)
	}

	return nil
}

// stops current backup cron job and drops last cron error if any
func (s *BackupScheduler) stopJobs() error {
	// stopping all cron jobs as there should be only one (c)
	for _, job := range s.cronmanager.Entries() {
		s.cronmanager.Remove(job.ID)
	}

	return s.s3backupService.DropStatus()
}

func (s *BackupScheduler) startJob(settings portainer.S3BackupSettings) error {
	_, err := s.cronmanager.AddFunc(settings.CronRule, s.backup(settings))
	if err != nil {
		return errors.Wrap(err, "failed to start a new backup cron job")
	}

	return nil
}

func canBeScheduled(s portainer.S3BackupSettings) bool {
	return s.AccessKeyID != "" && s.SecretAccessKey != "" && s.Region != "" && s.BucketName != "" && s.CronRule != ""
}

func (s *BackupScheduler) backup(settings portainer.S3BackupSettings) func() {
	return func() {
		err := BackupToS3(settings, s.gate, s.datastore, s.filestorePath)
		status := portainer.S3BackupStatus{
			Failed:    err != nil,
			Timestamp: time.Now(),
		}
		if err = s.s3backupService.UpdateStatus(status); err != nil {
			log.Printf("[ERROR] failed to update status of last scheduled backup. Status: %+v . Err: %s \n", status, err)
		}
	}
}
