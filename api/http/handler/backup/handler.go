package backup

import (
	"context"
	"net/http"

	"github.com/portainer/portainer/api/adminmonitor"
	"github.com/portainer/portainer/api/dataservices"
	"github.com/portainer/portainer/api/http/offlinegate"
	"github.com/portainer/portainer/api/http/security"
	httperror "github.com/portainer/portainer/pkg/libhttp/error"

	"github.com/gorilla/mux"
)

// Handler is an http handler responsible for backup and restore portainer state
type Handler struct {
	*mux.Router
	bouncer         security.BouncerService
	dataStore       dataservices.DataStore
	gate            *offlinegate.OfflineGate
	filestorePath   string
	shutdownTrigger context.CancelFunc
	adminMonitor    *adminmonitor.Monitor
}

// NewHandler creates an new instance of backup handler
func NewHandler(
	bouncer security.BouncerService,
	dataStore dataservices.DataStore,
	gate *offlinegate.OfflineGate,
	filestorePath string,
	shutdownTrigger context.CancelFunc,
	adminMonitor *adminmonitor.Monitor,
) *Handler {
	h := &Handler{
		Router:          mux.NewRouter(),
		bouncer:         bouncer,
		dataStore:       dataStore,
		gate:            gate,
		filestorePath:   filestorePath,
		shutdownTrigger: shutdownTrigger,
		adminMonitor:    adminMonitor,
	}

	h.Handle("/backup", bouncer.RestrictedAccess(adminAccess(httperror.LoggerHandler(h.backup)))).Methods(http.MethodPost)
	h.Handle("/restore", bouncer.PublicAccess(httperror.LoggerHandler(h.restore))).Methods(http.MethodPost)

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
