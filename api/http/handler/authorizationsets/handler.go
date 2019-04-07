package authorizationsets

import (
	"net/http"

	"github.com/gorilla/mux"
	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/http/security"
)

// Handler is the HTTP handler used to handle authorizationSet operations.
type Handler struct {
	*mux.Router
	AuthorizationSetService portainer.AuthorizationSetService
}

// TODO: disable authorization set management when RBAC extension is disabled
// NewHandler creates a handler to manage authorizationSet operations.
func NewHandler(bouncer *security.RequestBouncer) *Handler {
	h := &Handler{
		Router: mux.NewRouter(),
	}
	h.Handle("/authorization_sets",
		bouncer.AdministratorAccess(httperror.LoggerHandler(h.authorizationSetCreate))).Methods(http.MethodPost)
	h.Handle("/authorization_sets",
		bouncer.AdministratorAccess(httperror.LoggerHandler(h.authorizationSetList))).Methods(http.MethodGet)
	h.Handle("/authorization_sets/{id}",
		bouncer.AdministratorAccess(httperror.LoggerHandler(h.authorizationSetInspect))).Methods(http.MethodGet)
	h.Handle("/authorization_sets/{id}",
		bouncer.AdministratorAccess(httperror.LoggerHandler(h.authorizationSetUpdate))).Methods(http.MethodPut)
	h.Handle("/authorization_sets/{id}",
		bouncer.AdministratorAccess(httperror.LoggerHandler(h.authorizationSetDelete))).Methods(http.MethodDelete)

	return h
}
