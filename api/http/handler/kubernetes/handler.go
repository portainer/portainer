package kubernetes

import (
	"errors"
	"net/http"

	portainer "github.com/portainer/portainer/api"
	portainerDsErrors "github.com/portainer/portainer/api/dataservices/errors"
	"github.com/portainer/portainer/api/kubernetes"

	"github.com/gorilla/mux"
	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	"github.com/portainer/portainer/api/dataservices"
	"github.com/portainer/portainer/api/http/middlewares"
	"github.com/portainer/portainer/api/http/security"
	"github.com/portainer/portainer/api/internal/authorization"
	"github.com/portainer/portainer/api/internal/endpointutils"
	"github.com/portainer/portainer/api/kubernetes/cli"
)

// Handler is the HTTP handler which will natively deal with to external environments(endpoints).
type Handler struct {
	*mux.Router
	authorizationService     *authorization.Service
	dataStore                dataservices.DataStore
	jwtService               dataservices.JWTService
	kubernetesClientFactory  *cli.ClientFactory
	kubeClusterAccessService kubernetes.KubeClusterAccessService
	KubernetesClient         portainer.KubeClient
}

// NewHandler creates a handler to process pre-proxied requests to external APIs.
func NewHandler(bouncer *security.RequestBouncer, authorizationService *authorization.Service, dataStore dataservices.DataStore, jwtService dataservices.JWTService, kubeClusterAccessService kubernetes.KubeClusterAccessService, kubernetesClientFactory *cli.ClientFactory, kubernetesClient portainer.KubeClient) *Handler {
	h := &Handler{
		Router:                   mux.NewRouter(),
		authorizationService:     authorizationService,
		dataStore:                dataStore,
		jwtService:               jwtService,
		kubeClusterAccessService: kubeClusterAccessService,
		kubernetesClientFactory:  kubernetesClientFactory,
		KubernetesClient:         kubernetesClient,
	}

	kubeRouter := h.PathPrefix("/kubernetes").Subrouter()
	kubeRouter.Use(bouncer.AuthenticatedAccess)
	kubeRouter.PathPrefix("/config").Handler(
		bouncer.AuthenticatedAccess(httperror.LoggerHandler(h.getKubernetesConfig))).Methods(http.MethodGet)

	// endpoints
	endpointRouter := kubeRouter.PathPrefix("/{id}").Subrouter()
	endpointRouter.Use(middlewares.WithEndpoint(dataStore.Endpoint(), "id"))
	endpointRouter.Use(kubeOnlyMiddleware)
	endpointRouter.Use(h.kubeClient)

	endpointRouter.PathPrefix("/nodes_limits").Handler(httperror.LoggerHandler(h.getKubernetesNodesLimits)).Methods(http.MethodGet)
	endpointRouter.Handle("/ingresscontrollers", httperror.LoggerHandler(h.getKubernetesIngressControllers)).Methods(http.MethodGet)
	endpointRouter.Handle("/ingresscontrollers", httperror.LoggerHandler(h.updateKubernetesIngressControllers)).Methods(http.MethodPut)
	endpointRouter.Handle("/ingresses/delete", httperror.LoggerHandler(h.deleteKubernetesIngresses)).Methods(http.MethodPost)
	endpointRouter.Handle("/services/delete", httperror.LoggerHandler(h.deleteKubernetesServices)).Methods(http.MethodPost)
	endpointRouter.Path("/namespaces").Handler(httperror.LoggerHandler(h.createKubernetesNamespace)).Methods(http.MethodPost)
	endpointRouter.Path("/namespaces").Handler(httperror.LoggerHandler(h.updateKubernetesNamespace)).Methods(http.MethodPut)
	endpointRouter.Path("/namespaces").Handler(httperror.LoggerHandler(h.getKubernetesNamespaces)).Methods(http.MethodGet)
	endpointRouter.Path("/namespace/{namespace}").Handler(httperror.LoggerHandler(h.deleteKubernetesNamespaces)).Methods(http.MethodDelete)

	// namespaces
	// in the future this piece of code might be in another package (or a few different packages - namespaces/namespace?)
	// to keep it simple, we've decided to leave it like this.
	namespaceRouter := endpointRouter.PathPrefix("/namespaces/{namespace}").Subrouter()
	namespaceRouter.Handle("/system", bouncer.RestrictedAccess(httperror.LoggerHandler(h.namespacesToggleSystem))).Methods(http.MethodPut)
	namespaceRouter.Handle("/ingresscontrollers", httperror.LoggerHandler(h.getKubernetesIngressControllersByNamespace)).Methods(http.MethodGet)
	namespaceRouter.Handle("/ingresscontrollers", httperror.LoggerHandler(h.updateKubernetesIngressControllersByNamespace)).Methods(http.MethodPut)
	namespaceRouter.Handle("/configmaps", httperror.LoggerHandler(h.getKubernetesConfigMaps)).Methods(http.MethodGet)
	namespaceRouter.Handle("/ingresses", httperror.LoggerHandler(h.createKubernetesIngress)).Methods(http.MethodPost)
	namespaceRouter.Handle("/ingresses", httperror.LoggerHandler(h.updateKubernetesIngress)).Methods(http.MethodPut)
	namespaceRouter.Handle("/ingresses", httperror.LoggerHandler(h.getKubernetesIngresses)).Methods(http.MethodGet)
	namespaceRouter.Handle("/services", httperror.LoggerHandler(h.createKubernetesService)).Methods(http.MethodPost)
	namespaceRouter.Handle("/services", httperror.LoggerHandler(h.updateKubernetesService)).Methods(http.MethodPut)
	namespaceRouter.Handle("/services", httperror.LoggerHandler(h.getKubernetesServices)).Methods(http.MethodGet)

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

func (handler *Handler) kubeClient(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		endpointID, err := request.RetrieveNumericRouteVariableValue(r, "id")
		if err != nil {
			httperror.WriteError(
				w,
				http.StatusBadRequest,
				"Invalid environment identifier route variable",
				err,
			)
		}

		endpoint, err := handler.dataStore.Endpoint().Endpoint(portainer.EndpointID(endpointID))
		if err == portainerDsErrors.ErrObjectNotFound {
			httperror.WriteError(
				w,
				http.StatusNotFound,
				"Unable to find an environment with the specified identifier inside the database",
				err,
			)
		} else if err != nil {
			httperror.WriteError(
				w,
				http.StatusInternalServerError,
				"Unable to find an environment with the specified identifier inside the database",
				err,
			)
		}

		if handler.kubernetesClientFactory == nil {
			next.ServeHTTP(w, r)
			return
		}
		kubeCli, err := handler.kubernetesClientFactory.GetKubeClient(endpoint)
		if err != nil {
			httperror.WriteError(
				w,
				http.StatusInternalServerError,
				"Unable to create Kubernetes client",
				err,
			)

		}
		handler.KubernetesClient = kubeCli
		next.ServeHTTP(w, r)
	})
}
