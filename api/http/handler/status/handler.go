package status

import (
	"net/http"

	"github.com/gorilla/mux"
	httperror "github.com/portainer/libhttp/error"
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	"github.com/portainer/portainer/api/demo"
	"github.com/portainer/portainer/api/http/security"
)

// Handler is the HTTP handler used to handle status operations.
type Handler struct {
	*mux.Router
	status      *portainer.Status
	dataStore   dataservices.DataStore
	demoService *demo.Service
}

// NewHandler creates a handler to manage status operations.
func NewHandler(bouncer *security.RequestBouncer, status *portainer.Status, demoService *demo.Service, dataStore dataservices.DataStore) *Handler {
	h := &Handler{
		Router:      mux.NewRouter(),
		dataStore:   dataStore,
		demoService: demoService,
		status:      status,
	}

	h.Handle("/status",
		bouncer.PublicAccess(httperror.LoggerHandler(h.statusInspect))).Methods(http.MethodGet)
	h.Handle("/status/version",
		bouncer.AuthenticatedAccess(http.HandlerFunc(h.version))).Methods(http.MethodGet)
	h.Handle("/status/nodes",
		bouncer.AuthenticatedAccess(httperror.LoggerHandler(h.statusNodesCount))).Methods(http.MethodGet)
	h.Handle("/status/system",
		bouncer.AuthenticatedAccess(httperror.LoggerHandler(h.statusSystem))).Methods(http.MethodGet)

	return h
}
