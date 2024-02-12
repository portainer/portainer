package edgetemplates

import (
	"net/http"

	"github.com/portainer/portainer/api/dataservices"
	"github.com/portainer/portainer/api/http/middlewares"
	"github.com/portainer/portainer/api/http/security"
	httperror "github.com/portainer/portainer/pkg/libhttp/error"

	"github.com/gorilla/mux"
)

// Handler is the HTTP handler used to handle edge environment(endpoint) operations.
type Handler struct {
	*mux.Router
	requestBouncer security.BouncerService
	DataStore      dataservices.DataStore
}

// NewHandler creates a handler to manage environment(endpoint) operations.
func NewHandler(bouncer security.BouncerService) *Handler {
	h := &Handler{
		Router:         mux.NewRouter(),
		requestBouncer: bouncer,
	}

	h.Handle("/edge_templates",
		bouncer.AdminAccess(middlewares.Deprecated(httperror.LoggerHandler(h.edgeTemplateList), func(w http.ResponseWriter, r *http.Request) (string, *httperror.HandlerError) { return "", nil }))).Methods(http.MethodGet)

	return h
}
