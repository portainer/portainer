package roles

import (
	"net/http"

	"github.com/gorilla/mux"
	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/http/security"
)

// Handler is the HTTP handler used to handle role operations.
type Handler struct {
	*mux.Router
	RoleService portainer.RoleService
}

// TODO: disable authorization set management when RBAC extension is disabled
// NewHandler creates a handler to manage role operations.
func NewHandler(bouncer *security.RequestBouncer) *Handler {
	h := &Handler{
		Router: mux.NewRouter(),
	}
	h.Handle("/roles",
		bouncer.AdministratorAccess(httperror.LoggerHandler(h.roleCreate))).Methods(http.MethodPost)
	h.Handle("/roles",
		bouncer.AdministratorAccess(httperror.LoggerHandler(h.roleList))).Methods(http.MethodGet)
	h.Handle("/roles/{id}",
		bouncer.AdministratorAccess(httperror.LoggerHandler(h.roleInspect))).Methods(http.MethodGet)
	h.Handle("/roles/{id}",
		bouncer.AdministratorAccess(httperror.LoggerHandler(h.roleUpdate))).Methods(http.MethodPut)
	h.Handle("/roles/{id}",
		bouncer.AdministratorAccess(httperror.LoggerHandler(h.roleDelete))).Methods(http.MethodDelete)

	return h
}
