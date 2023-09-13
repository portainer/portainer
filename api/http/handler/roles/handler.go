package roles

import (
	"net/http"

	"github.com/portainer/portainer/api/dataservices"
	"github.com/portainer/portainer/api/http/security"
	httperror "github.com/portainer/portainer/pkg/libhttp/error"

	"github.com/gorilla/mux"
)

// Handler is the HTTP handler used to handle role operations.
type Handler struct {
	*mux.Router
	DataStore dataservices.DataStore
}

// NewHandler creates a handler to manage role operations.
func NewHandler(bouncer security.BouncerService) *Handler {
	h := &Handler{
		Router: mux.NewRouter(),
	}
	h.Handle("/roles",
		bouncer.AdminAccess(httperror.LoggerHandler(h.roleList))).Methods(http.MethodGet)

	return h
}
