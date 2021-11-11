package openamt

import (
	"net/http"

	"github.com/gorilla/mux"

	httperror "github.com/portainer/libhttp/error"
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/http/security"
)

// Handler is the HTTP handler used to handle OpenAMT operations.
type Handler struct {
	*mux.Router
	OpenAMTService portainer.OpenAMTService
}

// NewHandler returns a new Handler
func NewHandler(bouncer *security.RequestBouncer) *Handler {
	h := &Handler{
		Router: mux.NewRouter(),
	}
	h.Handle("/open-amt",
		bouncer.AdminAccess(httperror.LoggerHandler(h.openAMTSubmit))).Methods(http.MethodPut)

	return h
}
