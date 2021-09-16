package kubernetes

import (
	"errors"
	"net/http"

	"github.com/gorilla/mux"
	httperror "github.com/portainer/libhttp/error"
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/http/middlewares"
	"github.com/portainer/portainer/api/http/security"
	"github.com/portainer/portainer/api/internal/authorization"
	"github.com/portainer/portainer/api/internal/endpointutils"
	"github.com/portainer/portainer/api/kubernetes/cli"
)

// Handler is the HTTP handler which will natively deal with to external environments(endpoints).
type Handler struct {
	*mux.Router
	dataStore               portainer.DataStore
	kubernetesClientFactory *cli.ClientFactory
	authorizationService    *authorization.Service
	JwtService              portainer.JWTService
}

// NewHandler creates a handler to process pre-proxied requests to external APIs.
func NewHandler(bouncer *security.RequestBouncer, authorizationService *authorization.Service, dataStore portainer.DataStore, kubernetesClientFactory *cli.ClientFactory) *Handler {
	h := &Handler{
		Router:                  mux.NewRouter(),
		dataStore:               dataStore,
		kubernetesClientFactory: kubernetesClientFactory,
		authorizationService:    authorizationService,
	}

	kubeRouter := h.PathPrefix("/kubernetes/{id}").Subrouter()

	kubeRouter.Use(bouncer.AuthenticatedAccess)
	kubeRouter.Use(middlewares.WithEndpoint(dataStore.Endpoint(), "id"))
	kubeRouter.Use(kubeOnlyMiddleware)

	kubeRouter.PathPrefix("/config").Handler(
		bouncer.AuthenticatedAccess(httperror.LoggerHandler(h.getKubernetesConfig))).Methods(http.MethodGet)
	kubeRouter.PathPrefix("/nodes_limits").Handler(
		bouncer.AuthenticatedAccess(httperror.LoggerHandler(h.getKubernetesNodesLimits))).Methods(http.MethodGet)

	// namespaces
	// in the future this piece of code might be in another package (or a few different packages - namespaces/namespace?)
	// to keep it simple, we've decided to leave it like this.
	namespaceRouter := kubeRouter.PathPrefix("/namespaces/{namespace}").Subrouter()
	namespaceRouter.Handle("/system", bouncer.RestrictedAccess(httperror.LoggerHandler(h.namespacesToggleSystem))).Methods(http.MethodPut)

	return h
}

func kubeOnlyMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(rw http.ResponseWriter, request *http.Request) {
		endpoint, err := middlewares.FetchEndpoint(request)
		if err != nil {
			httperror.WriteError(rw, http.StatusInternalServerError, "Unable to find an environment on request context", err)
			return
		}

		if !endpointutils.IsKubernetesEndpoint(endpoint) {
			errMessage := "Environment is not a kubernetes environment"
			httperror.WriteError(rw, http.StatusBadRequest, errMessage, errors.New(errMessage))
			return
		}

		next.ServeHTTP(rw, request)
	})
}
