package s3backup

import (
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/bolt/errors"
	"github.com/portainer/portainer/api/bolt/internal"
)

const (
	bucketName  = "s3backup"
	statusKey   = "lastRunStatus"
	settingsKey = "settings"
)

type Service struct {
	connection *internal.DbConnection
}

// NewService creates a new service and ensures corresponding bucket exist
func NewService(connection *internal.DbConnection) (*Service, error) {
	err := internal.CreateBucket(connection, bucketName)
	if err != nil {
		return nil, err
	}

	return &Service{
		connection: connection,
	}, nil
}

// GetStatus returns the status of the last scheduled backup run
func (s *Service) GetStatus() (portainer.S3BackupStatus, error) {
	var status portainer.S3BackupStatus
	err := internal.GetObject(s.connection, bucketName, []byte(statusKey), &status)
	if err == errors.ErrObjectNotFound {
		return status, nil
	}

	return status, err
}

// DropStatus deletes the status of the last sheduled backup run
func (s *Service) DropStatus() error {
	return internal.DeleteObject(s.connection, bucketName, []byte(statusKey))
}

// UpdateStatus upserts a status of the last scheduled backup run
func (s *Service) UpdateStatus(status portainer.S3BackupStatus) error {
	return internal.UpdateObject(s.connection, bucketName, []byte(statusKey), status)
}

// UpdateSettings updates stored s3 backup settings
func (s *Service) UpdateSettings(settings portainer.S3BackupSettings) error {
	return internal.UpdateObject(s.connection, bucketName, []byte(settingsKey), settings)
}

// GetSettings returns stored s3 backup settings
func (s *Service) GetSettings() (portainer.S3BackupSettings, error) {
	var settings portainer.S3BackupSettings
	err := internal.GetObject(s.connection, bucketName, []byte(settingsKey), &settings)
	if err == errors.ErrObjectNotFound {
		return settings, nil
	}

	return settings, err
}
