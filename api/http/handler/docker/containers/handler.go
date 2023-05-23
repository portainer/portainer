package containers

import (
	"net/http"

	"github.com/gorilla/mux"
	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/portainer/api/docker/client"
	"github.com/portainer/portainer/api/http/security"
)

type Handler struct {
	*mux.Router
	dockerClientFactory *client.ClientFactory
}

// NewHandler creates a handler to process non-proxied requests to docker APIs directly.
func NewHandler(routePrefix string, bouncer *security.RequestBouncer, dockerClientFactory *client.ClientFactory) *Handler {
	h := &Handler{
		Router: mux.NewRouter(),

		dockerClientFactory: dockerClientFactory,
	}

	router := h.PathPrefix(routePrefix).Subrouter()
	router.Use(bouncer.AuthenticatedAccess)

	router.Handle("/{containerId}/gpus", httperror.LoggerHandler(h.containerGpusInspect)).Methods(http.MethodGet)

	return h
}
