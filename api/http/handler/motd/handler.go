package motd

import (
	"net/http"

	"github.com/gorilla/mux"
	"github.com/portainer/portainer/api/http/security"
	motdservice "github.com/portainer/portainer/api/motd"
)

// Handler is the HTTP handler used to handle MOTD operations.
type Handler struct {
	*mux.Router
	motdService *motdservice.Service
}

// NewHandler returns a new Handler
func NewHandler(bouncer security.BouncerService, svc *motdservice.Service) *Handler {
	h := &Handler{
		Router:      mux.NewRouter(),
		motdService: svc,
	}
	h.Handle("/motd",
		bouncer.RestrictedAccess(http.HandlerFunc(h.motd))).Methods(http.MethodGet)

	return h
}
