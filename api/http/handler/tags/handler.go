package tags

import (
	"net/http"

	"github.com/gorilla/mux"
	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/portainer"
	"github.com/portainer/portainer/http/security"
)

// Handler is the HTTP handler used to handle tag operations.
type Handler struct {
	*mux.Router
	TagService portainer.TagService
}

// NewHandler creates a handler to manage tag operations.
func NewHandler(bouncer *security.RequestBouncer) *Handler {
	h := &Handler{
		Router: mux.NewRouter(),
	}
	h.Handle("/tags",
		bouncer.AdministratorAccess(httperror.LoggerHandler(h.tagCreate))).Methods(http.MethodPost)
	h.Handle("/tags",
		bouncer.AdministratorAccess(httperror.LoggerHandler(h.tagList))).Methods(http.MethodGet)
	h.Handle("/tags/{id}",
		bouncer.AdministratorAccess(httperror.LoggerHandler(h.tagDelete))).Methods(http.MethodDelete)

	return h
}
