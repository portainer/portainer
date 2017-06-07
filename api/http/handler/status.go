package handler

import (
	"github.com/portainer/portainer"
	"github.com/portainer/portainer/http/security"

	"log"
	"net/http"
	"os"

	"github.com/gorilla/mux"
)

// StatusHandler represents an HTTP API handler for managing Status.
type StatusHandler struct {
	*mux.Router
	Logger *log.Logger
	Status *portainer.Status
}

// NewStatusHandler returns a new instance of StatusHandler.
func NewStatusHandler(bouncer *security.RequestBouncer, status *portainer.Status) *StatusHandler {
	h := &StatusHandler{
		Router: mux.NewRouter(),
		Logger: log.New(os.Stderr, "", log.LstdFlags),
		Status: status,
	}
	h.Handle("/status",
		bouncer.PublicAccess(http.HandlerFunc(h.handleGetStatus))).Methods(http.MethodGet)

	return h
}

// handleGetStatus handles GET requests on /status
func (handler *StatusHandler) handleGetStatus(w http.ResponseWriter, r *http.Request) {
	encodeJSON(w, handler.Status, handler.Logger)
	return
}
