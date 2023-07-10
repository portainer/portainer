package kubernetes

import (
	"errors"
	"net/http"
	"net/url"
	"strconv"

	portainer "github.com/portainer/portainer/api"
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
	DataStore                dataservices.DataStore
	KubernetesClientFactory  *cli.ClientFactory
	JwtService               dataservices.JWTService
	kubeClusterAccessService kubernetes.KubeClusterAccessService
}

// NewHandler creates a handler to process pre-proxied requests to external APIs.
func NewHandler(bouncer security.BouncerService, authorizationService *authorization.Service, dataStore dataservices.DataStore, jwtService dataservices.JWTService, kubeClusterAccessService kubernetes.KubeClusterAccessService, kubernetesClientFactory *cli.ClientFactory, kubernetesClient portainer.KubeClient) *Handler {
	h := &Handler{
		Router:                   mux.NewRouter(),
		authorizationService:     authorizationService,
		DataStore:                dataStore,
		JwtService:               jwtService,
		kubeClusterAccessService: kubeClusterAccessService,
		KubernetesClientFactory:  kubernetesClientFactory,
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
	endpointRouter.Path("/metrics/nodes").Handler(httperror.LoggerHandler(h.getKubernetesMetricsForAllNodes)).Methods(http.MethodGet)
	endpointRouter.Path("/metrics/nodes/{name}").Handler(httperror.LoggerHandler(h.getKubernetesMetricsForNode)).Methods(http.MethodGet)
	endpointRouter.Path("/metrics/pods/namespace/{namespace}").Handler(httperror.LoggerHandler(h.getKubernetesMetricsForAllPods)).Methods(http.MethodGet)
	endpointRouter.Path("/metrics/pods/namespace/{namespace}/{name}").Handler(httperror.LoggerHandler(h.getKubernetesMetricsForPod)).Methods(http.MethodGet)
	endpointRouter.Handle("/ingresscontrollers", httperror.LoggerHandler(h.getKubernetesIngressControllers)).Methods(http.MethodGet)
	endpointRouter.Handle("/ingresscontrollers", httperror.LoggerHandler(h.updateKubernetesIngressControllers)).Methods(http.MethodPut)
	endpointRouter.Handle("/ingresses/delete", httperror.LoggerHandler(h.deleteKubernetesIngresses)).Methods(http.MethodPost)
	endpointRouter.Handle("/services/delete", httperror.LoggerHandler(h.deleteKubernetesServices)).Methods(http.MethodPost)
	endpointRouter.Path("/rbac_enabled").Handler(httperror.LoggerHandler(h.isRBACEnabled)).Methods(http.MethodGet)
	endpointRouter.Path("/namespaces").Handler(httperror.LoggerHandler(h.createKubernetesNamespace)).Methods(http.MethodPost)
	endpointRouter.Path("/namespaces").Handler(httperror.LoggerHandler(h.updateKubernetesNamespace)).Methods(http.MethodPut)
	endpointRouter.Path("/namespaces").Handler(httperror.LoggerHandler(h.getKubernetesNamespaces)).Methods(http.MethodGet)
	endpointRouter.Path("/namespace/{namespace}").Handler(httperror.LoggerHandler(h.deleteKubernetesNamespace)).Methods(http.MethodDelete)
	endpointRouter.Path("/namespaces/{namespace}").Handler(httperror.LoggerHandler(h.getKubernetesNamespace)).Methods(http.MethodGet)

	// namespaces
	// in the future this piece of code might be in another package (or a few different packages - namespaces/namespace?)
	// to keep it simple, we've decided to leave it like this.
	namespaceRouter := endpointRouter.PathPrefix("/namespaces/{namespace}").Subrouter()
	namespaceRouter.Handle("/system", bouncer.RestrictedAccess(httperror.LoggerHandler(h.namespacesToggleSystem))).Methods(http.MethodPut)
	namespaceRouter.Handle("/ingresscontrollers", httperror.LoggerHandler(h.getKubernetesIngressControllersByNamespace)).Methods(http.MethodGet)
	namespaceRouter.Handle("/ingresscontrollers", httperror.LoggerHandler(h.updateKubernetesIngressControllersByNamespace)).Methods(http.MethodPut)
	namespaceRouter.Handle("/configuration", httperror.LoggerHandler(h.getKubernetesConfigMapsAndSecrets)).Methods(http.MethodGet)
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
			httperror.InternalServerError(
				"Unable to find an environment on request context",
				err,
			)
			return
		}

		if !endpointutils.IsKubernetesEndpoint(endpoint) {
			errMessage := "environment is not a Kubernetes environment"
			httperror.BadRequest(
				errMessage,
				errors.New(errMessage),
			)
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
			return
		}

		endpoint, err := handler.DataStore.Endpoint().Endpoint(portainer.EndpointID(endpointID))
		if handler.DataStore.IsErrObjectNotFound(err) {
			httperror.WriteError(
				w,
				http.StatusNotFound,
				"Unable to find an environment with the specified identifier inside the database",
				err,
			)
			return
		} else if err != nil {
			httperror.WriteError(
				w,
				http.StatusInternalServerError,
				"Unable to find an environment with the specified identifier inside the database",
				err,
			)
			return
		}

		if handler.KubernetesClientFactory == nil {
			next.ServeHTTP(w, r)
			return
		}
		// Generate a proxied kubeconfig, then create a kubeclient using it.
		tokenData, err := security.RetrieveTokenData(r)
		if err != nil {
			httperror.WriteError(
				w,
				http.StatusForbidden,
				"Permission denied to access environment",
				err,
			)
			return
		}
		bearerToken, err := handler.JwtService.GenerateTokenForKubeconfig(tokenData)
		if err != nil {
			httperror.WriteError(
				w,
				http.StatusInternalServerError,
				"Unable to create JWT token",
				err,
			)
			return
		}
		singleEndpointList := []portainer.Endpoint{
			*endpoint,
		}
		config := handler.buildConfig(
			r,
			tokenData,
			bearerToken,
			singleEndpointList,
			true,
		)

		if len(config.Clusters) == 0 {
			httperror.WriteError(
				w,
				http.StatusInternalServerError,
				"Unable build cluster kubeconfig",
				errors.New("Unable build cluster kubeconfig"),
			)
			return
		}

		// Manually setting the localhost to route
		// the request to proxy server
		serverURL, err := url.Parse(config.Clusters[0].Cluster.Server)
		if err != nil {
			httperror.WriteError(
				w,
				http.StatusInternalServerError,
				"Unable parse cluster's kubeconfig server URL",
				nil,
			)
			return
		}
		serverURL.Scheme = "https"
		serverURL.Host = "localhost" + handler.KubernetesClientFactory.AddrHTTPS
		config.Clusters[0].Cluster.Server = serverURL.String()

		yaml, err := cli.GenerateYAML(config)
		if err != nil {
			httperror.WriteError(
				w,
				http.StatusInternalServerError,
				"Unable to generate yaml from endpoint kubeconfig",
				err,
			)
			return
		}
		kubeCli, err := handler.KubernetesClientFactory.CreateKubeClientFromKubeConfig(endpoint.Name, []byte(yaml))
		if err != nil {
			httperror.WriteError(
				w,
				http.StatusInternalServerError,
				"Failed to create client from kubeconfig",
				err,
			)
			return
		}

		handler.KubernetesClientFactory.SetProxyKubeClient(strconv.Itoa(int(endpoint.ID)), r.Header.Get("Authorization"), kubeCli)
		next.ServeHTTP(w, r)
	})
}
