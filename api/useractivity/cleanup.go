package useractivity

import (
	"fmt"
	"log"
	"time"

	storm "github.com/asdine/storm/v3"
	"github.com/asdine/storm/v3/q"
	portainer "github.com/portainer/portainer/api"
)

func (store *Store) startCleanupLoop() error {
	if store.isCleanupLoopRunning() {
		return nil
	}

	log.Printf("[DEBUG] [useractivity] [check_interval_seconds: %f] [message: starting logs cleanup process]", cleanupInterval.Seconds())
	err := store.cleanLogs()
	if err != nil {
		return fmt.Errorf("failed starting logs cleanup process: %w", err)
	}

	go func() {
		ticker := time.NewTicker(cleanupInterval)
		store.cleanupStopSignal = make(chan struct{})

		for {
			select {
			case <-ticker.C:
				log.Printf("[DEBUG] [useractivity] [message: cleaning logs]")
				err := store.cleanLogs()
				if err != nil {
					log.Printf("[ERROR] [useractivity] [message: failed clearing auth logs] [error: %s]", err)
				}
			case <-store.cleanupStopSignal:
				ticker.Stop()
			}
		}
	}()

	return nil
}

func (store *Store) isCleanupLoopRunning() bool {
	return store.cleanupStopSignal != nil
}

func (store *Store) stopCleanupLoop() {
	if !store.isCleanupLoopRunning() {
		return
	}

	close(store.cleanupStopSignal)
	store.cleanupStopSignal = nil

}

func (store *Store) cleanLogs() error {
	count, err := store.cleanLogsByType(&portainer.AuthActivityLog{})
	if err != nil {
		return fmt.Errorf("failed cleaning auth logs: %w", err)
	}
	log.Printf("[DEBUG] [message: removed %d old auth logs]", count)

	count, err = store.cleanLogsByType(&portainer.UserActivityLog{})
	if err != nil {
		return fmt.Errorf("failed cleaning user activity logs: %w", err)
	}
	log.Printf("[DEBUG] [message: removed %d old user activity logs]", count)

	return nil
}

func (store *Store) cleanLogsByType(obj interface{}) (int, error) {
	oldLogsDate := time.Now().AddDate(0, 0, -1*maxLogsAge).Unix()
	query := store.db.Select(q.Lte("Timestamp", oldLogsDate))

	count, err := query.Count(obj)
	if err != nil && err != storm.ErrNotFound {
		return 0, fmt.Errorf("failed counting old logs: %w", err)
	}

	if count == 0 {
		return count, nil
	}

	err = query.Delete(obj)
	if err != nil && err != storm.ErrNotFound {
		return 0, fmt.Errorf("failed cleaning logs: %w", err)
	}

	return count, nil
}
