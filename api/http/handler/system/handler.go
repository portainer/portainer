package system

import (
	"net/http"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	"github.com/portainer/portainer/api/http/security"
	"github.com/portainer/portainer/api/internal/upgrade"
	"github.com/portainer/portainer/api/platform"
	httperror "github.com/portainer/portainer/pkg/libhttp/error"

	"github.com/gorilla/mux"
)

// Handler is the HTTP handler used to handle status operations.
type Handler struct {
	*mux.Router
	status          *portainer.Status
	dataStore       dataservices.DataStore
	upgradeService  upgrade.Service
	platformService platform.Service
}

// NewHandler creates a handler to manage status operations.
func NewHandler(bouncer security.BouncerService,
	status *portainer.Status,
	dataStore dataservices.DataStore,
	platformService platform.Service,
	upgradeService upgrade.Service) *Handler {

	h := &Handler{
		Router:          mux.NewRouter(),
		dataStore:       dataStore,
		status:          status,
		upgradeService:  upgradeService,
		platformService: platformService,
	}

	router := h.PathPrefix("/system").Subrouter()

	adminRouter := router.PathPrefix("/").Subrouter()
	adminRouter.Use(bouncer.AdminAccess)

	adminRouter.Handle("/upgrade", httperror.LoggerHandler(h.systemUpgrade)).Methods(http.MethodPost)

	authenticatedRouter := router.PathPrefix("/").Subrouter()
	authenticatedRouter.Use(bouncer.AuthenticatedAccess)

	authenticatedRouter.Handle("/version", httperror.LoggerHandler(h.version)).Methods(http.MethodGet)
	authenticatedRouter.Handle("/nodes", httperror.LoggerHandler(h.systemNodesCount)).Methods(http.MethodGet)
	authenticatedRouter.Handle("/info", httperror.LoggerHandler(h.systemInfo)).Methods(http.MethodGet)

	publicRouter := router.PathPrefix("/").Subrouter()
	publicRouter.Use(bouncer.PublicAccess)

	publicRouter.Handle("/status", httperror.LoggerHandler(h.systemStatus)).Methods(http.MethodGet)

	// Deprecated /status endpoint, will be removed in the future.
	h.Handle("/status",
		bouncer.PublicAccess(httperror.LoggerHandler(h.statusInspectDeprecated))).Methods(http.MethodGet)

	return h
}
