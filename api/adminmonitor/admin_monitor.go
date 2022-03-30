package adminmonitor

import (
	"context"
	"embed"
	"io/fs"
	"log"
	"net/http"
	"strings"
	"sync"
	"time"

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

// New creates a monitor that when started will wait for an admin account being created for timeout duration
// if and admin account would still be missing, it'll disable the http traffic handling
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

//go:embed timeout
var timeoutFiles embed.FS

// WithRedirect checks whether administrator initialisation timeout. If so, it will return the error with redirect reason.
// Otherwise, it will pass through the request to next
func (m *Monitor) WithRedirect(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if m.WasInstanceDisabled() {
			if r.RequestURI == `/` || strings.HasPrefix(r.RequestURI, "/api") {
				w.Header().Set("redirect-reason", `Administrator initialization timeout`)
				http.Redirect(w, r, `/timeout.html`, http.StatusSeeOther)
				return
			}

			files, err := fs.Sub(timeoutFiles, "timeout")
			if err != nil {
				log.Printf("Error %s\n", err)
			}
			http.FileServer(http.FS(files)).ServeHTTP(w, r)
			return
		}

		next.ServeHTTP(w, r)
	})
}
