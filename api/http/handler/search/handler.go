package search

import (
	"net/http"

	"github.com/gorilla/mux"
	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/http/security"
)

// Handler is the HTTP handler used to handle tag operations.
type Handler struct {
	*mux.Router
	DataStore portainer.DataStore
}

// NewHandler creates a handler to manage search operations.
func NewHandler(bouncer *security.RequestBouncer) *Handler {
	h := &Handler{
		Router: mux.NewRouter(),
	}
	h.Handle("/search",
		bouncer.RestrictedAccess(httperror.LoggerHandler(h.search))).Methods(http.MethodGet)
	return h
}
