package useractivity

import (
	"net/http"

	"github.com/gorilla/mux"
	httperror "github.com/portainer/libhttp/error"
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/http/security"
)

// Handler is the HTTP handler used to handle user activity operations
type Handler struct {
	*mux.Router
	UserActivityStore portainer.UserActivityStore
}

// NewHandler creates a handler.
func NewHandler(bouncer *security.RequestBouncer) *Handler {
	h := &Handler{
		Router: mux.NewRouter(),
	}

	h.Handle("/useractivity/authlogs",
		bouncer.AdminAccess(httperror.LoggerHandler(h.authLogsList))).Methods(http.MethodGet)
	h.Handle("/useractivity/authlogs.csv",
		bouncer.AdminAccess(httperror.LoggerHandler(h.authLogsCSV))).Methods(http.MethodGet)

	return h
}
