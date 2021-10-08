package teams

import (
	"net/http"

	"github.com/gorilla/mux"
	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/portainer/api/dataservices"
	"github.com/portainer/portainer/api/http/security"
)

// Handler is the HTTP handler used to handle team operations.
type Handler struct {
	*mux.Router
	DataStore dataservices.DataStore
}

// NewHandler creates a handler to manage team operations.
func NewHandler(bouncer *security.RequestBouncer) *Handler {
	h := &Handler{
		Router: mux.NewRouter(),
	}
	h.Handle("/teams",
		bouncer.AdminAccess(httperror.LoggerHandler(h.teamCreate))).Methods(http.MethodPost)
	h.Handle("/teams",
		bouncer.RestrictedAccess(httperror.LoggerHandler(h.teamList))).Methods(http.MethodGet)
	h.Handle("/teams/{id}",
		bouncer.AdminAccess(httperror.LoggerHandler(h.teamInspect))).Methods(http.MethodGet)
	h.Handle("/teams/{id}",
		bouncer.AdminAccess(httperror.LoggerHandler(h.teamUpdate))).Methods(http.MethodPut)
	h.Handle("/teams/{id}",
		bouncer.AdminAccess(httperror.LoggerHandler(h.teamDelete))).Methods(http.MethodDelete)
	h.Handle("/teams/{id}/memberships",
		bouncer.AdminAccess(httperror.LoggerHandler(h.teamMemberships))).Methods(http.MethodGet)

	return h
}
