package docker

import (
	"errors"
	"net/http"

	"github.com/portainer/portainer/api/dataservices"
	"github.com/portainer/portainer/api/docker"
	dockerclient "github.com/portainer/portainer/api/docker/client"
	"github.com/portainer/portainer/api/http/handler/docker/containers"
	"github.com/portainer/portainer/api/http/handler/docker/images"
	"github.com/portainer/portainer/api/http/middlewares"
	"github.com/portainer/portainer/api/http/security"
	"github.com/portainer/portainer/api/internal/authorization"
	"github.com/portainer/portainer/api/internal/endpointutils"
	httperror "github.com/portainer/portainer/pkg/libhttp/error"

	"github.com/gorilla/mux"
)

// Handler is the HTTP handler which will natively deal with to external environments(endpoints).
type Handler struct {
	*mux.Router
	requestBouncer       security.BouncerService
	dataStore            dataservices.DataStore
	dockerClientFactory  *dockerclient.ClientFactory
	authorizationService *authorization.Service
	containerService     *docker.ContainerService
}

// NewHandler creates a handler to process non-proxied requests to docker APIs directly.
func NewHandler(bouncer security.BouncerService, authorizationService *authorization.Service, dataStore dataservices.DataStore, dockerClientFactory *dockerclient.ClientFactory, containerService *docker.ContainerService) *Handler {
	h := &Handler{
		Router:               mux.NewRouter(),
		requestBouncer:       bouncer,
		authorizationService: authorizationService,
		dataStore:            dataStore,
		dockerClientFactory:  dockerClientFactory,
		containerService:     containerService,
	}

	// endpoints
	endpointRouter := h.PathPrefix("/docker/{id}").Subrouter()
	endpointRouter.Use(bouncer.AuthenticatedAccess)
	endpointRouter.Use(middlewares.WithEndpoint(dataStore.Endpoint(), "id"), dockerOnlyMiddleware)

	endpointRouter.Handle("/dashboard", httperror.LoggerHandler(h.dashboard)).Methods(http.MethodGet)

	containersHandler := containers.NewHandler("/docker/{id}/containers", bouncer, dataStore, dockerClientFactory, containerService)
	endpointRouter.PathPrefix("/containers").Handler(containersHandler)

	imagesHandler := images.NewHandler("/docker/{id}/images", bouncer, dockerClientFactory)
	endpointRouter.PathPrefix("/images").Handler(imagesHandler)
	return h
}

func dockerOnlyMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(rw http.ResponseWriter, request *http.Request) {
		endpoint, err := middlewares.FetchEndpoint(request)
		if err != nil {
			httperror.WriteError(rw, http.StatusInternalServerError, "Unable to find an environment on request context", err)
			return
		}

		if !endpointutils.IsDockerEndpoint(endpoint) {
			errMessage := "environment is not a docker environment"
			httperror.WriteError(rw, http.StatusBadRequest, errMessage, errors.New(errMessage))
			return
		}
		next.ServeHTTP(rw, request)
	})
}
