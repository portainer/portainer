package motd

import (
	"net/http"

	"github.com/gorilla/mux"
	httperror "github.com/portainer/portainer/http/error"
	"github.com/portainer/portainer/http/security"
)

// Handler is the HTTP handler used to handle MOTD operations.
type Handler struct {
	*mux.Router
}

// NewHandler returns a new Handler
func NewHandler(bouncer *security.RequestBouncer) *Handler {
	h := &Handler{
		Router: mux.NewRouter(),
	}
	h.Handle("/motd",
		bouncer.AuthenticatedAccess(httperror.LoggerHandler(h.motd))).Methods(http.MethodGet)

	return h
}
