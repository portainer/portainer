package backup

import (
	"testing"
	"time"

	portainer "github.com/portainer/portainer/api"
	i "github.com/portainer/portainer/api/internal/testhelpers"
	"github.com/stretchr/testify/assert"
)

func newScheduler(status *portainer.S3BackupStatus, settings *portainer.S3BackupSettings) *BackupScheduler {
	scheduler := NewBackupScheduler(nil, i.NewDatastore(i.WithS3BackupService(status, settings)), "")
	scheduler.Start()

	return scheduler
}

func settings(cronRule string,
	accessKeyID string,
	secretAccessKey string,
	region string,
	bucketName string) *portainer.S3BackupSettings {
	return &portainer.S3BackupSettings{
		CronRule:        cronRule,
		AccessKeyID:     accessKeyID,
		SecretAccessKey: secretAccessKey,
		Region:          region,
		BucketName:      bucketName,
	}
}

func Test_startWithoutCron_shouldNotStartAJob(t *testing.T) {
	scheduler := newScheduler(&portainer.S3BackupStatus{}, &portainer.S3BackupSettings{})
	defer scheduler.Stop()

	jobs := scheduler.cronmanager.Entries()
	assert.Len(t, jobs, 0, "should have empty job list")
}

func Test_startWitACron_shouldAlsoStartAJob(t *testing.T) {
	scheduler := newScheduler(&portainer.S3BackupStatus{}, settings("*/10 * * * *", "id", "key", "region", "bucket"))
	defer scheduler.Stop()

	jobs := scheduler.cronmanager.Entries()
	assert.Len(t, jobs, 1, "should have 1 active job")
}

func Test_update_shouldDropStatus(t *testing.T) {
	storedStatus := &portainer.S3BackupStatus{Failed: true, Timestamp: time.Now().Add(-time.Hour)}
	scheduler := newScheduler(storedStatus, &portainer.S3BackupSettings{})
	defer scheduler.Stop()

	scheduler.Update(*settings("*/10 * * * *", "id", "key", "region", "bucket"))
	assert.Equal(t, portainer.S3BackupStatus{}, *storedStatus, "stasus should be dropped")
}

func Test_update_shouldUpdateSettings(t *testing.T) {
	storedSettings := &portainer.S3BackupSettings{}
	scheduler := newScheduler(&portainer.S3BackupStatus{}, storedSettings)
	defer scheduler.Stop()

	newSettings := settings("", "id2", "key2", "region2", "bucket2")
	scheduler.Update(*newSettings)

	assert.EqualValues(t, *storedSettings, *newSettings, "updated settings should match stored settings")
}

func Test_updateWithCron_shouldStartAJob(t *testing.T) {
	scheduler := newScheduler(&portainer.S3BackupStatus{}, &portainer.S3BackupSettings{})
	defer scheduler.Stop()

	jobs := scheduler.cronmanager.Entries()
	assert.Len(t, jobs, 0, "should have empty job list upon startup")

	scheduler.Update(*settings("*/10 * * * *", "id", "key", "region", "bucket"))

	jobs = scheduler.cronmanager.Entries()
	assert.Len(t, jobs, 1, "should have 1 active job")
}

func Test_updateWithoutCron_shouldStopActiveJob(t *testing.T) {
	scheduler := newScheduler(&portainer.S3BackupStatus{}, &portainer.S3BackupSettings{})
	defer scheduler.Stop()

	scheduler.Update(*settings("*/10 * * * *", "id", "key", "region", "bucket"))

	jobs := scheduler.cronmanager.Entries()
	assert.Len(t, jobs, 1, "should have 1 active job")

	scheduler.Update(*settings("", "id2", "key2", "region2", "bucket2"))

	jobs = scheduler.cronmanager.Entries()
	assert.Len(t, jobs, 0, "should have no active jobs")
}

func Test_updateWithACron_shouldStopActiveJob_andStartNewJob(t *testing.T) {
	scheduler := newScheduler(&portainer.S3BackupStatus{}, &portainer.S3BackupSettings{})
	defer scheduler.Stop()

	scheduler.Update(*settings("*/10 * * * *", "id", "key", "region", "bucket"))

	jobs := scheduler.cronmanager.Entries()
	assert.Len(t, jobs, 1, "should have 1 active job")
	initJobId := jobs[0].ID

	scheduler.Update(*settings("*/10 * * * *", "id", "key", "region", "bucket"))

	jobs = scheduler.cronmanager.Entries()
	assert.Len(t, jobs, 1, "should have 1 active job")
	assert.NotEqual(t, initJobId, jobs[0].ID, "new job should have a diffent id")
}
