package kubernetes

import (
	"errors"
	"net/http"
	"net/url"
	"strconv"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	"github.com/portainer/portainer/api/http/middlewares"
	"github.com/portainer/portainer/api/http/security"
	"github.com/portainer/portainer/api/internal/authorization"
	"github.com/portainer/portainer/api/internal/endpointutils"
	"github.com/portainer/portainer/api/kubernetes"
	"github.com/portainer/portainer/api/kubernetes/cli"
	httperror "github.com/portainer/portainer/pkg/libhttp/error"
	"github.com/portainer/portainer/pkg/libhttp/request"

	"github.com/gorilla/mux"
)

// Handler is the HTTP handler which will natively deal with to external environments(endpoints).
type Handler struct {
	*mux.Router
	authorizationService     *authorization.Service
	DataStore                dataservices.DataStore
	KubernetesClientFactory  *cli.ClientFactory
	JwtService               portainer.JWTService
	kubeClusterAccessService kubernetes.KubeClusterAccessService
}

// NewHandler creates a handler to process pre-proxied requests to external APIs.
func NewHandler(bouncer security.BouncerService, authorizationService *authorization.Service, dataStore dataservices.DataStore, jwtService portainer.JWTService, kubeClusterAccessService kubernetes.KubeClusterAccessService, kubernetesClientFactory *cli.ClientFactory, kubernetesClient portainer.KubeClient) *Handler {
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
	endpointRouter.Use(h.kubeClientMiddleware)

	endpointRouter.Handle("/dashboard", httperror.LoggerHandler(h.getKubernetesDashboard)).Methods(http.MethodGet)
	endpointRouter.Handle("/nodes_limits", httperror.LoggerHandler(h.getKubernetesNodesLimits)).Methods(http.MethodGet)
	endpointRouter.Handle("/max_resource_limits", httperror.LoggerHandler(h.getKubernetesMaxResourceLimits)).Methods(http.MethodGet)
	endpointRouter.Handle("/metrics/nodes", httperror.LoggerHandler(h.getKubernetesMetricsForAllNodes)).Methods(http.MethodGet)
	endpointRouter.Handle("/metrics/nodes/{name}", httperror.LoggerHandler(h.getKubernetesMetricsForNode)).Methods(http.MethodGet)
	endpointRouter.Handle("/metrics/pods/namespace/{namespace}", httperror.LoggerHandler(h.getKubernetesMetricsForAllPods)).Methods(http.MethodGet)
	endpointRouter.Handle("/metrics/pods/namespace/{namespace}/{name}", httperror.LoggerHandler(h.getKubernetesMetricsForPod)).Methods(http.MethodGet)
	endpointRouter.Handle("/ingresscontrollers", httperror.LoggerHandler(h.getKubernetesIngressControllers)).Methods(http.MethodGet)
	endpointRouter.Handle("/ingresscontrollers", httperror.LoggerHandler(h.updateKubernetesIngressControllers)).Methods(http.MethodPut)
	endpointRouter.Handle("/ingresses/delete", httperror.LoggerHandler(h.deleteKubernetesIngresses)).Methods(http.MethodPost)
	endpointRouter.Handle("/services/delete", httperror.LoggerHandler(h.deleteKubernetesServices)).Methods(http.MethodPost)
	endpointRouter.Handle("/rbac_enabled", httperror.LoggerHandler(h.isRBACEnabled)).Methods(http.MethodGet)
	endpointRouter.Handle("/namespaces", httperror.LoggerHandler(h.createKubernetesNamespace)).Methods(http.MethodPost)
	endpointRouter.Handle("/namespaces", httperror.LoggerHandler(h.updateKubernetesNamespace)).Methods(http.MethodPut)
	endpointRouter.Handle("/namespaces", httperror.LoggerHandler(h.getKubernetesNamespaces)).Methods(http.MethodGet)
	endpointRouter.Handle("/namespace/{namespace}", httperror.LoggerHandler(h.deleteKubernetesNamespace)).Methods(http.MethodDelete)
	endpointRouter.Handle("/namespaces/{namespace}", httperror.LoggerHandler(h.getKubernetesNamespace)).Methods(http.MethodGet)

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

		rw.Header().Set(portainer.PortainerCacheHeader, "true")
		next.ServeHTTP(rw, request)
	})
}

// getProxyKubeClient gets a kubeclient for the user.  It's generally what you want as it retrieves the kubeclient
// from the Authorization token of the currently logged in user.  The kubeclient that is not from the proxy is actually using
// admin permissions.  If you're unsure which one to use, use this.
func (h *Handler) getProxyKubeClient(r *http.Request) (*cli.KubeClient, *httperror.HandlerError) {
	endpointID, err := request.RetrieveNumericRouteVariableValue(r, "id")
	if err != nil {
		return nil, httperror.BadRequest("Invalid environment identifier route variable", err)
	}

	tokenData, err := security.RetrieveTokenData(r)
	if err != nil {
		return nil, httperror.Forbidden("Permission denied to access environment", err)
	}

	cli, ok := h.KubernetesClientFactory.GetProxyKubeClient(strconv.Itoa(endpointID), tokenData.Token)
	if !ok {
		return nil, httperror.InternalServerError("Failed to lookup KubeClient", nil)
	}

	return cli, nil
}

func (handler *Handler) kubeClientMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if handler.KubernetesClientFactory == nil {
			next.ServeHTTP(w, r)
			return
		}

		endpointID, err := request.RetrieveNumericRouteVariableValue(r, "id")
		if err != nil {
			httperror.WriteError(w, http.StatusBadRequest, "Invalid environment identifier route variable", err)
			return
		}

		tokenData, err := security.RetrieveTokenData(r)
		if err != nil {
			httperror.WriteError(w, http.StatusForbidden, "Permission denied to access environment", err)
		}

		// Check if we have a kubeclient against this auth token already, otherwise generate a new one
		_, ok := handler.KubernetesClientFactory.GetProxyKubeClient(strconv.Itoa(endpointID), tokenData.Token)
		if ok {
			next.ServeHTTP(w, r)
			return
		}

		endpoint, err := handler.DataStore.Endpoint().Endpoint(portainer.EndpointID(endpointID))
		if err != nil {
			if handler.DataStore.IsErrObjectNotFound(err) {
				httperror.WriteError(
					w,
					http.StatusNotFound,
					"Unable to find an environment with the specified identifier inside the database",
					err,
				)
				return
			}

			httperror.WriteError(w, http.StatusInternalServerError, "Unable to read the environment from the database", err)
			return
		}

		bearerToken, err := handler.JwtService.GenerateTokenForKubeconfig(tokenData)
		if err != nil {
			httperror.WriteError(w, http.StatusInternalServerError, "Unable to create JWT token", err)
			return
		}

		config := handler.buildConfig(r, tokenData, bearerToken, []portainer.Endpoint{*endpoint}, true)
		if len(config.Clusters) == 0 {
			httperror.WriteError(w, http.StatusInternalServerError, "Unable build cluster kubeconfig", nil)
			return
		}

		// Manually setting serverURL to localhost to route the request to proxy server
		serverURL, err := url.Parse(config.Clusters[0].Cluster.Server)
		if err != nil {
			httperror.WriteError(w, http.StatusInternalServerError, "Unable parse cluster's kubeconfig server URL", nil)
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
			httperror.WriteError(w, http.StatusInternalServerError, "Failed to create client from kubeconfig", err)
			return
		}

		handler.KubernetesClientFactory.SetProxyKubeClient(strconv.Itoa(int(endpoint.ID)), tokenData.Token, kubeCli)
		next.ServeHTTP(w, r)
	})
}
