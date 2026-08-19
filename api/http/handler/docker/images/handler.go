package images

import (
	"net/http"

	"github.com/portainer/portainer/api/docker/client"
	"github.com/portainer/portainer/api/http/middlewares"
	"github.com/portainer/portainer/api/http/security"
	httperror "github.com/portainer/portainer/pkg/libhttp/error"

	"github.com/gorilla/mux"
)

type Handler struct {
	*mux.Router
	dockerClientFactory *client.ClientFactory
	bouncer             security.BouncerService
}

// NewHandler creates a handler to process non-proxied requests to docker APIs directly.
func NewHandler(routePrefix string, bouncer security.BouncerService, dockerClientFactory *client.ClientFactory) *Handler {
	h := &Handler{
		Router:              mux.NewRouter(),
		dockerClientFactory: dockerClientFactory,
		bouncer:             bouncer,
	}

	router := h.PathPrefix(routePrefix).Subrouter()
	router.Use(bouncer.AuthenticatedAccess, middlewares.CheckEndpointAuthorization(bouncer))

	router.Handle("", httperror.LoggerHandler(h.imagesList)).Methods(http.MethodGet)
	return h
}
