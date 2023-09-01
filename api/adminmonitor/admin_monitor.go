package adminmonitor

import (
	"context"
	"net/http"
	"strings"
	"sync"
	"time"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	httperror "github.com/portainer/portainer/pkg/libhttp/error"

	"github.com/rs/zerolog/log"
)

const RedirectReasonAdminInitTimeout string = "AdminInitTimeout"

type Monitor struct {
	timeout           time.Duration
	datastore         dataservices.DataStore
	shutdownCtx       context.Context
	cancellationFunc  context.CancelFunc
	mu                sync.RWMutex
	adminInitDisabled bool
}

// New creates a monitor that when started will wait for the timeout duration and then shutdown the application unless it has been initialized.
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
		log.Debug().Msg("start initialization monitor")

		select {
		case <-time.After(m.timeout):
			initialized, err := m.WasInitialized()
			if err != nil {
				log.Error().Err(err).Msg("AdminMonitor failed to determine if Portainer is Initialized")
				return
			}

			if !initialized {
				log.Info().Msg("the Portainer instance timed out for security purposes, to re-enable your Portainer instance, you will need to restart Portainer")

				m.mu.Lock()
				defer m.mu.Unlock()

				m.adminInitDisabled = true
				return
			}
		case <-cancellationCtx.Done():
			log.Debug().Msg("canceling initialization monitor")
		case <-m.shutdownCtx.Done():
			log.Debug().Msg("shutting down initialization monitor")
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
	m.mu.RLock()
	defer m.mu.RUnlock()

	return m.adminInitDisabled
}

// WithRedirect checks whether administrator initialisation timeout. If so, it will return the error with redirect reason.
// Otherwise, it will pass through the request to next
func (m *Monitor) WithRedirect(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if m.WasInstanceDisabled() && strings.HasPrefix(r.RequestURI, "/api") && r.RequestURI != "/api/status" && r.RequestURI != "/api/settings/public" {
			w.Header().Set("redirect-reason", RedirectReasonAdminInitTimeout)
			httperror.WriteError(w, http.StatusSeeOther, "Administrator initialization timeout", nil)
			return
		}

		next.ServeHTTP(w, r)
	})
}
