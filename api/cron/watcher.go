package cron

import (
	"github.com/portainer/portainer"
	"github.com/robfig/cron"
)

// Watcher represents a service for managing crons.
type Watcher struct {
	Cron            *cron.Cron
	EndpointService portainer.EndpointService
	syncInterval    string
}

// NewWatcher initializes a new service.
func NewWatcher(endpointService portainer.EndpointService, syncInterval string) *Watcher {
	return &Watcher{
		Cron:            cron.New(),
		EndpointService: endpointService,
		syncInterval:    syncInterval,
	}
}

// WatchEndpointFile starts a cron job to synchronize the endpoints from a file
func (watcher *Watcher) WatchEndpointFile(endpointFilePath string) error {
	job := newEndpointSyncJob(endpointFilePath, watcher.EndpointService)

	err := job.Sync()
	if err != nil {
		return err
	}

	err = watcher.Cron.AddJob("@every "+watcher.syncInterval, job)
	if err != nil {
		return err
	}

	watcher.Cron.Start()
	return nil
}
