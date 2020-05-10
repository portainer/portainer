package edgetemplates

import (
	"net/http"

	httperror "github.com/portainer/libhttp/error"

	"github.com/gorilla/mux"
	"github.com/portainer/portainer/api/http/security"
)

// Handler is the HTTP handler used to handle edge endpoint operations.
type Handler struct {
	*mux.Router
	requestBouncer *security.RequestBouncer
}

// NewHandler creates a handler to manage endpoint operations.
func NewHandler(bouncer *security.RequestBouncer) *Handler {
	h := &Handler{
		Router:         mux.NewRouter(),
		requestBouncer: bouncer,
	}

	h.Handle("/edge_templates",
		bouncer.AuthenticatedAccess(httperror.LoggerHandler(h.edgeTemplateList))).Methods(http.MethodGet)

	return h
}
