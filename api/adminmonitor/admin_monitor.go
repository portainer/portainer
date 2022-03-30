package adminmonitor

import (
	"context"
	"log"
	"net/http"
	"strings"
	"sync"
	"time"

	httperror "github.com/portainer/libhttp/error"
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
)

var logFatalf = log.Fatalf

const RedirectReasonAdminInitTimeout string = "AdminInitTimeout"

type Monitor struct {
	timeout           time.Duration
	datastore         dataservices.DataStore
	shutdownCtx       context.Context
	cancellationFunc  context.CancelFunc
	mu                sync.Mutex
	adminInitDisabled bool
}

// New creates a monitor that when started will wait for the timeout duration and then sends the timeout signal to disable the application
func New(timeout time.Duration, datastore dataservices.DataStore, shutdownCtx context.Context) *Monitor {
	return &Monitor{
		timeout:           timeout,
		datastore:         datastore,
		shutdownCtx:       shutdownCtx,
		adminInitDisabled: false,
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
				m.mu.Lock()
				defer m.mu.Unlock()
				m.adminInitDisabled = true
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

func (m *Monitor) WasInstanceDisabled() bool {
	m.mu.Lock()
	defer m.mu.Unlock()
	return m.adminInitDisabled
}

// WithRedirect checks whether administrator initialisation timeout. If so, it will return the error with redirect reason.
// Otherwise, it will pass through the request to next
func (m *Monitor) WithRedirect(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if m.WasInstanceDisabled() {
			if strings.HasPrefix(r.RequestURI, "/api") && r.RequestURI != "/api/status" && r.RequestURI != "/api/settings/public" {
				w.Header().Set("redirect-reason", RedirectReasonAdminInitTimeout)
				httperror.WriteError(w, http.StatusSeeOther, "Administrator initialization timeout", nil)
				return
			}
		}

		next.ServeHTTP(w, r)
	})
}
