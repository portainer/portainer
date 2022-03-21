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
var logPrintf = log.Printf

type Monitor struct {
	timeout          time.Duration
	datastore        dataservices.DataStore
	shutdownCtx      context.Context
	cancellationFunc context.CancelFunc
	mu               sync.Mutex
	timeoutCh        chan interface{}
}

// New creates a monitor that when started will wait for the timeout duration and then shutdown the application unless it has been initialized.
func New(timeout time.Duration, datastore dataservices.DataStore, timeoutCh chan interface{}, shutdownCtx context.Context) *Monitor {
	return &Monitor{
		timeout:     timeout,
		datastore:   datastore,
		shutdownCtx: shutdownCtx,
		timeoutCh:   timeoutCh,
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
				logPrintf("[FATAL] [internal,init] No administrator account was created in %f mins. Shutting down the Portainer instance for security reasons", m.timeout.Minutes())
				if m.timeoutCh != nil {
					m.timeoutCh <- struct{}{}
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
