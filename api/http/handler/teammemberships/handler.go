package teammemberships

import (
	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/portainer/api/dataservices"
	"github.com/portainer/portainer/api/http/security"

	"net/http"

	"github.com/gorilla/mux"
)

// Handler is the HTTP handler used to handle team membership operations.
type Handler struct {
	*mux.Router
	DataStore dataservices.DataStore
}

// NewHandler creates a handler to manage team membership operations.
func NewHandler(bouncer *security.RequestBouncer) *Handler {
	h := &Handler{
		Router: mux.NewRouter(),
	}
	h.Handle("/team_memberships",
		bouncer.AdminAccess(httperror.LoggerHandler(h.teamMembershipCreate))).Methods(http.MethodPost)
	h.Handle("/team_memberships",
		bouncer.AdminAccess(httperror.LoggerHandler(h.teamMembershipList))).Methods(http.MethodGet)
	h.Handle("/team_memberships/{id}",
		bouncer.AdminAccess(httperror.LoggerHandler(h.teamMembershipUpdate))).Methods(http.MethodPut)
	h.Handle("/team_memberships/{id}",
		bouncer.AdminAccess(httperror.LoggerHandler(h.teamMembershipDelete))).Methods(http.MethodDelete)

	return h
}
