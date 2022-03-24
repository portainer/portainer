package adminmonitor

import (
	"context"
	"log"
	"sync"
	"time"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
)

var logFatalf = log.Fatalf

type Monitor struct {
	timeout          time.Duration
	datastore        dataservices.DataStore
	shutdownCtx      context.Context
	cancellationFunc context.CancelFunc
	mu               sync.Mutex
	timeoutSignal    chan<- interface{}
}

// New creates a monitor that when started will wait for the timeout duration and then sends the timeout signal to disable the application
func New(timeout time.Duration, datastore dataservices.DataStore, timeoutSignal chan<- interface{}, shutdownCtx context.Context) *Monitor {
	return &Monitor{
		timeout:       timeout,
		datastore:     datastore,
		shutdownCtx:   shutdownCtx,
		timeoutSignal: timeoutSignal,
	}
}

// Starts starts the monitor. Active monitor could be stopped or shuttted down by cancelling the shutdown context.
func (m *Monitor) Start() {
	m.mu.Lock()
	defer m.mu.Unlock()

	if m.cancellationFunc != nil {
		return
	}

	cancellationCtx, cancellationFunc := context.WithCancel(context.Background())
	m.cancellationFunc = cancellationFunc

	go func() {
		log.Println("[DEBUG] [internal,init] [message: start initialization monitor ]")
		select {
		case <-time.After(m.timeout):
			initialized, err := m.WasInitialized()
			if err != nil {
				logFatalf("%s", err)
			}
			if !initialized {
				log.Println("[INFO] [internal,init] The Portainer instance timed out for security purposes. To re-enable your Portainer instance, you will need to restart Portainer")
				if m.timeoutSignal != nil {
					close(m.timeoutSignal)
				}
				return
			}
		case <-cancellationCtx.Done():
			log.Println("[DEBUG] [internal,init] [message: canceling initialization monitor]")
		case <-m.shutdownCtx.Done():
			log.Println("[DEBUG] [internal,init] [message: shutting down initialization monitor]")
		}
	}()
}

// Stop stops monitor. Safe to call even if monitor wasn't started.
func (m *Monitor) Stop() {
	m.mu.Lock()
	defer m.mu.Unlock()

	if m.cancellationFunc == nil {
		return
	}
	m.cancellationFunc()
	m.cancellationFunc = nil
}

// WasInitialized is a system initialization check
func (m *Monitor) WasInitialized() (bool, error) {
	users, err := m.datastore.User().UsersByRole(portainer.AdministratorRole)
	if err != nil {
		return false, err
	}
	return len(users) > 0, nil
}
