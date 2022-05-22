package backup

import (
	"context"
	"net/http"

	"github.com/gorilla/mux"
	httperror "github.com/portainer/libhttp/error"
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/adminmonitor"
	"github.com/portainer/portainer/api/dataservices"
	"github.com/portainer/portainer/api/demo"
	"github.com/portainer/portainer/api/http/middlewares"
	"github.com/portainer/portainer/api/http/offlinegate"
	"github.com/portainer/portainer/api/http/security"
)

// Handler is an http handler responsible for backup and restore portainer state
type Handler struct {
	*mux.Router
	bouncer         *security.RequestBouncer
	dataStore       dataservices.DataStore
	gate            *offlinegate.OfflineGate
	filestorePath   string
	shutdownTrigger context.CancelFunc
	adminMonitor    *adminmonitor.Monitor
}

// NewHandler creates an new instance of backup handler
func NewHandler(
	bouncer *security.RequestBouncer,
	dataStore dataservices.DataStore,
	gate *offlinegate.OfflineGate,
	filestorePath string,
	shutdownTrigger context.CancelFunc,
	adminMonitor *adminmonitor.Monitor,
	demoService *demo.Service,

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

	demoRestrictedRouter := h.NewRoute().Subrouter()
	demoRestrictedRouter.Use(middlewares.RestrictDemoEnv(demoService.IsDemo))

	demoRestrictedRouter.Handle("/backup", bouncer.RestrictedAccess(adminAccess(httperror.LoggerHandler(h.backup)))).Methods(http.MethodPost)
	demoRestrictedRouter.Handle("/restore", bouncer.PublicAccess(httperror.LoggerHandler(h.restore))).Methods(http.MethodPost)

	return h
}

func adminAccess(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		securityContext, err := security.RetrieveRestrictedRequestContext(r)
		if err != nil {
			httperror.WriteError(w, http.StatusInternalServerError, "Unable to retrieve user info from request context", err)
		}

		if !securityContext.IsAdmin {
			httperror.WriteError(w, http.StatusUnauthorized, "User is not authorized to perform the action", nil)
		}

		next.ServeHTTP(w, r)
	})
}

func systemWasInitialized(dataStore dataservices.DataStore) (bool, error) {
	users, err := dataStore.User().UsersByRole(portainer.AdministratorRole)
	if err != nil {
		return false, err
	}
	return len(users) > 0, nil
}
