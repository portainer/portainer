package deploykeys

import (
	"net/http"

	"github.com/gorilla/mux"
	"github.com/portainer/portainer"
	httperror "github.com/portainer/portainer/http/error"
	"github.com/portainer/portainer/http/security"
)

// Handler is the HTTP handler used to handle Deploykey operations.
type Handler struct {
	*mux.Router
	DeploykeyService portainer.DeploykeyService
}

// NewHandler creates a handler to manage Deploykey operations.
func NewHandler(bouncer *security.RequestBouncer) *Handler {
	h := &Handler{
		Router: mux.NewRouter(),
	}
	h.Handle("/deploykeys",
		bouncer.AdministratorAccess(httperror.LoggerHandler(h.deploykeyCreate))).Methods(http.MethodPost)
	h.Handle("/deploykeys",
		bouncer.AdministratorAccess(httperror.LoggerHandler(h.deploykeyList))).Methods(http.MethodGet)
	h.Handle("/deploykeys/{id}",
		bouncer.AdministratorAccess(httperror.LoggerHandler(h.deploykeyDelete))).Methods(http.MethodDelete)

	return h
}
