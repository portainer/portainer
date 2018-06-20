package teams

import (
	"net/http"

	"github.com/gorilla/mux"
	"github.com/portainer/portainer"
	httperror "github.com/portainer/portainer/http/error"
	"github.com/portainer/portainer/http/security"
)

// Handler is the HTTP handler used to handle team operations.
type Handler struct {
	*mux.Router
	TeamService            portainer.TeamService
	TeamMembershipService  portainer.TeamMembershipService
	ResourceControlService portainer.ResourceControlService
}

// NewHandler creates a handler to manage team operations.
func NewHandler(bouncer *security.RequestBouncer) *Handler {
	h := &Handler{
		Router: mux.NewRouter(),
	}
	h.Handle("/teams",
		bouncer.AdministratorAccess(httperror.LoggerHandler(h.teamCreate))).Methods(http.MethodPost)
	h.Handle("/teams",
		bouncer.RestrictedAccess(httperror.LoggerHandler(h.teamList))).Methods(http.MethodGet)
	h.Handle("/teams/{id}",
		bouncer.RestrictedAccess(httperror.LoggerHandler(h.teamInspect))).Methods(http.MethodGet)
	h.Handle("/teams/{id}",
		bouncer.AdministratorAccess(httperror.LoggerHandler(h.teamUpdate))).Methods(http.MethodPut)
	h.Handle("/teams/{id}",
		bouncer.AdministratorAccess(httperror.LoggerHandler(h.teamDelete))).Methods(http.MethodDelete)
	h.Handle("/teams/{id}/memberships",
		bouncer.RestrictedAccess(httperror.LoggerHandler(h.teamMemberships))).Methods(http.MethodGet)

	return h
}
