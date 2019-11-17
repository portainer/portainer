package support

import (
	"net/http"

	httperror "github.com/portainer/libhttp/error"

	"github.com/gorilla/mux"
	"github.com/portainer/portainer/api/http/security"
)

// Handler is the HTTP handler used to handle support operations.
type Handler struct {
	*mux.Router
}

// NewHandler returns a new Handler
func NewHandler(bouncer *security.RequestBouncer) *Handler {
	h := &Handler{
		Router: mux.NewRouter(),
	}
	h.Handle("/support",
		bouncer.AuthenticatedAccess(httperror.LoggerHandler(h.supportList))).Methods(http.MethodGet)

	return h
}
