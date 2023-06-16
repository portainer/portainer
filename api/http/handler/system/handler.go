package system

import (
	"net/http"

	"github.com/gorilla/mux"
	httperror "github.com/portainer/libhttp/error"
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	"github.com/portainer/portainer/api/demo"
	"github.com/portainer/portainer/api/http/security"
	"github.com/portainer/portainer/api/internal/upgrade"
)

// Handler is the HTTP handler used to handle status operations.
type Handler struct {
	*mux.Router
	status         *portainer.Status
	dataStore      dataservices.DataStore
	demoService    *demo.Service
	upgradeService upgrade.Service
}

// NewHandler creates a handler to manage status operations.
func NewHandler(bouncer security.BouncerService,
	status *portainer.Status,
	demoService *demo.Service,
	dataStore dataservices.DataStore,
	upgradeService upgrade.Service) *Handler {

	h := &Handler{
		Router:         mux.NewRouter(),
		dataStore:      dataStore,
		demoService:    demoService,
		status:         status,
		upgradeService: upgradeService,
	}

	router := h.PathPrefix("/system").Subrouter()

	adminRouter := router.PathPrefix("/").Subrouter()
	adminRouter.Use(bouncer.AdminAccess)

	adminRouter.Handle("/upgrade", httperror.LoggerHandler(h.systemUpgrade)).Methods(http.MethodPost)

	authenticatedRouter := router.PathPrefix("/").Subrouter()
	authenticatedRouter.Use(bouncer.AuthenticatedAccess)

	authenticatedRouter.Handle("/version", http.HandlerFunc(h.version)).Methods(http.MethodGet)
	authenticatedRouter.Handle("/nodes", httperror.LoggerHandler(h.systemNodesCount)).Methods(http.MethodGet)
	authenticatedRouter.Handle("/info", httperror.LoggerHandler(h.systemInfo)).Methods(http.MethodGet)

	publicRouter := router.PathPrefix("/").Subrouter()
	publicRouter.Use(bouncer.PublicAccess)

	publicRouter.Handle("/status", httperror.LoggerHandler(h.systemStatus)).Methods(http.MethodGet)

	// Deprecated /status endpoint, will be removed in the future.
	h.Handle("/status",
		bouncer.PublicAccess(httperror.LoggerHandler(h.statusInspectDeprecated))).Methods(http.MethodGet)
	h.Handle("/status/version",
		bouncer.AuthenticatedAccess(http.HandlerFunc(h.versionDeprecated))).Methods(http.MethodGet)
	h.Handle("/status/nodes",
		bouncer.AuthenticatedAccess(httperror.LoggerHandler(h.statusNodesCountDeprecated))).Methods(http.MethodGet)

	return h
}
