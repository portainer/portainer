package licenses

import (
	"net/http"

	"github.com/gorilla/mux"
	httperror "github.com/portainer/libhttp/error"
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/http/security"
)

const (
	handlerActivityContext = "Portainer"
)

// Handler is the HTTP handler used to handle Edge job operations.
type Handler struct {
	*mux.Router
	LicenseService    portainer.LicenseService
	UserActivityStore portainer.UserActivityStore
}

// NewHandler creates a handler to manage Edge job operations.
func NewHandler(bouncer *security.RequestBouncer) *Handler {
	h := &Handler{
		Router: mux.NewRouter(),
	}

	h.Handle("/licenses",
		bouncer.AdminAccess(httperror.LoggerHandler(h.licensesList))).Methods(http.MethodGet)
	h.Handle("/licenses",
		bouncer.AdminAccess(httperror.LoggerHandler(h.licensesAttach))).Methods(http.MethodPost)
	h.Handle("/licenses/remove",
		bouncer.AdminAccess(httperror.LoggerHandler(h.licensesDelete))).Methods(http.MethodPost)
	h.Handle("/licenses/info",
		bouncer.PublicAccess(httperror.LoggerHandler(h.licensesInfo))).Methods(http.MethodGet)
	return h
}
