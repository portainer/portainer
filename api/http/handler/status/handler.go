package status

import (
	"net/http"

	"github.com/gorilla/mux"
	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/portainer"
	"github.com/portainer/portainer/http/security"
)

// Handler is the HTTP handler used to handle status operations.
type Handler struct {
	*mux.Router
	Status *portainer.Status
}

// NewHandler creates a handler to manage status operations.
func NewHandler(bouncer *security.RequestBouncer, status *portainer.Status) *Handler {
	h := &Handler{
		Router: mux.NewRouter(),
		Status: status,
	}
	h.Handle("/status",
		bouncer.PublicAccess(httperror.LoggerHandler(h.statusInspect))).Methods(http.MethodGet)

	return h
}
