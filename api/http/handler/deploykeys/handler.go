package deploykeys

import (
	"net/http"

	"github.com/gorilla/mux"
	"github.com/portainer/portainer"
	httperror "github.com/portainer/portainer/http/error"
	"github.com/portainer/portainer/http/security"
)

// Handler is the HTTP handler used to handle deploykey operations.
type Handler struct {
	*mux.Router
	DeploykeyService portainer.DeploykeyService
	//DigitalSignatureService portainer.DigitalSignatureService
}

// NewHandler creates a handler to manage deploykey operations.
func NewHandler(bouncer *security.RequestBouncer) *Handler {
	h := &Handler{
		Router: mux.NewRouter(),
	}
	h.Handle("/deploykeys",
		bouncer.AuthenticatedAccess(httperror.LoggerHandler(h.deploykeyCreate))).Methods(http.MethodPost)
	h.Handle("/deploykeys",
		bouncer.AuthenticatedAccess(httperror.LoggerHandler(h.deploykeyList))).Methods(http.MethodGet)
	h.Handle("/deploykeys/{id}",
		bouncer.AuthenticatedAccess(httperror.LoggerHandler(h.deploykeyDelete))).Methods(http.MethodDelete)

	return h
}
