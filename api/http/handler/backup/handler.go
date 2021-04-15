package backup

import (
	"context"
	"net/http"

	"github.com/gorilla/mux"
	httperror "github.com/portainer/libhttp/error"
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/adminmonitor"
	operations "github.com/portainer/portainer/api/backup"
	"github.com/portainer/portainer/api/http/offlinegate"
	"github.com/portainer/portainer/api/http/security"
)

// Handler is an http handler responsible for backup and restore portainer state
type Handler struct {
	*mux.Router
	backupScheduler *operations.BackupScheduler
	bouncer         *security.RequestBouncer
	dataStore       portainer.DataStore
	gate            *offlinegate.OfflineGate
	filestorePath   string
	shutdownTrigger context.CancelFunc
	adminMonitor    *adminmonitor.Monitor
}

// NewHandler creates an new instance of backup handler
func NewHandler(bouncer *security.RequestBouncer, dataStore portainer.DataStore, gate *offlinegate.OfflineGate, filestorePath string, backupScheduler *operations.BackupScheduler, shutdownTrigger context.CancelFunc, adminMonitor *adminmonitor.Monitor) *Handler {
	h := &Handler{
		Router:          mux.NewRouter(),
		bouncer:         bouncer,
		backupScheduler: backupScheduler,
		dataStore:       dataStore,
		gate:            gate,
		filestorePath:   filestorePath,
		shutdownTrigger: shutdownTrigger,
		adminMonitor:    adminMonitor,
	}

	h.Handle("/backup/s3/settings", bouncer.RestrictedAccess(adminAccess(httperror.LoggerHandler(h.backupSettingsFetch)))).Methods(http.MethodGet)
	h.Handle("/backup/s3/settings", bouncer.RestrictedAccess(adminAccess(httperror.LoggerHandler(h.updateSettings)))).Methods(http.MethodPost)
	h.Handle("/backup/s3/status", bouncer.PublicAccess(httperror.LoggerHandler(h.backupStatusFetch))).Methods(http.MethodGet)
	h.Handle("/backup/s3/execute", bouncer.RestrictedAccess(adminAccess(httperror.LoggerHandler(h.backupToS3)))).Methods(http.MethodPost)
	h.Handle("/backup/s3/restore", bouncer.PublicAccess(httperror.LoggerHandler(h.restoreFromS3))).Methods(http.MethodPost)
	h.Handle("/backup", bouncer.RestrictedAccess(adminAccess(httperror.LoggerHandler(h.backup)))).Methods(http.MethodPost)
	h.Handle("/restore", bouncer.PublicAccess(httperror.LoggerHandler(h.restore))).Methods(http.MethodPost)

	return h
}

func adminAccess(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		securityContext, err := security.RetrieveRestrictedRequestContext(r)
		if err != nil {
			httperror.WriteError(w, http.StatusInternalServerError, "Unable to retrieve user info from request context", err)
		}

		if !securityContext.IsAdmin {
			httperror.WriteError(w, http.StatusUnauthorized, "User is not authorized to perfom the action", nil)
		}

		next.ServeHTTP(w, r)
	})
}
