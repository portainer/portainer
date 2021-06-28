package backup

import (
	"context"
	"net/http"

	"github.com/gorilla/mux"
	"github.com/pkg/errors"
	httperror "github.com/portainer/libhttp/error"
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/adminmonitor"
	"github.com/portainer/portainer/api/http/offlinegate"
	"github.com/portainer/portainer/api/http/security"
)

// Handler is an http handler responsible for backup and restore portainer state
type Handler struct {
	*mux.Router
	bouncer         *security.RequestBouncer
	dataStore       portainer.DataStore
	gate            *offlinegate.OfflineGate
	filestorePath   string
	shutdownTrigger context.CancelFunc
	adminMonitor    *adminmonitor.Monitor
}

// NewHandler creates an new instance of backup handler
func NewHandler(bouncer *security.RequestBouncer, dataStore portainer.DataStore, gate *offlinegate.OfflineGate, filestorePath string, shutdownTrigger context.CancelFunc, adminMonitor *adminmonitor.Monitor, isDemo bool) *Handler {
	h := &Handler{
		Router:          mux.NewRouter(),
		bouncer:         bouncer,
		dataStore:       dataStore,
		gate:            gate,
		filestorePath:   filestorePath,
		shutdownTrigger: shutdownTrigger,
		adminMonitor:    adminMonitor,
	}

	h.Handle("/backup", restrictDemoEnv(isDemo, bouncer.RestrictedAccess(adminAccess(httperror.LoggerHandler(h.backup))))).Methods(http.MethodPost)
	h.Handle("/restore", restrictDemoEnv(isDemo, bouncer.PublicAccess(httperror.LoggerHandler(h.restore)))).Methods(http.MethodPost)

	return h
}

func adminAccess(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		securityContext, err := security.RetrieveRestrictedRequestContext(r)
		if err != nil {
			httperror.WriteError(w, http.StatusInternalServerError, "Unable to retrieve user info from request context", err)
			return
		}

		if !securityContext.IsAdmin {
			httperror.WriteError(w, http.StatusUnauthorized, "User is not authorized to perform the action", nil)
			return
		}

		next.ServeHTTP(w, r)
	})
}

// restrict backup functionality on demo environments
func restrictDemoEnv(isDemo bool, next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if isDemo {
			httperror.WriteError(w, http.StatusBadRequest, "This feature is not available in the demo version of Portainer", errors.New("this feature is not available in the demo version of Portainer"))
			return
		}

		next.ServeHTTP(w, r)
	})
}
