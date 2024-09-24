package kubernetes

import (
	"fmt"
	"net/http"
	"net/url"
	"strconv"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	"github.com/portainer/portainer/api/http/middlewares"
	"github.com/portainer/portainer/api/http/security"
	"github.com/portainer/portainer/api/internal/authorization"
	"github.com/portainer/portainer/api/kubernetes"
	"github.com/portainer/portainer/api/kubernetes/cli"
	httperror "github.com/portainer/portainer/pkg/libhttp/error"
	"github.com/portainer/portainer/pkg/libhttp/request"
	"github.com/rs/zerolog/log"

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
	endpointRouter.Use(h.kubeClientMiddleware)

	endpointRouter.Handle("/applications", httperror.LoggerHandler(h.GetAllKubernetesApplications)).Methods(http.MethodGet)
	endpointRouter.Handle("/applications/count", httperror.LoggerHandler(h.getAllKubernetesApplicationsCount)).Methods(http.MethodGet)
	endpointRouter.Handle("/configmaps", httperror.LoggerHandler(h.GetAllKubernetesConfigMaps)).Methods(http.MethodGet)
	endpointRouter.Handle("/configmaps/count", httperror.LoggerHandler(h.getAllKubernetesConfigMapsCount)).Methods(http.MethodGet)
	endpointRouter.Handle("/cluster_roles", httperror.LoggerHandler(h.getAllKubernetesClusterRoles)).Methods(http.MethodGet)
	endpointRouter.Handle("/cluster_role_bindings", httperror.LoggerHandler(h.getAllKubernetesClusterRoleBindings)).Methods(http.MethodGet)
	endpointRouter.Handle("/configmaps", httperror.LoggerHandler(h.GetAllKubernetesConfigMaps)).Methods(http.MethodGet)
	endpointRouter.Handle("/configmaps/count", httperror.LoggerHandler(h.getAllKubernetesConfigMapsCount)).Methods(http.MethodGet)
	endpointRouter.Handle("/dashboard", httperror.LoggerHandler(h.getKubernetesDashboard)).Methods(http.MethodGet)
	endpointRouter.Handle("/nodes_limits", httperror.LoggerHandler(h.getKubernetesNodesLimits)).Methods(http.MethodGet)
	endpointRouter.Handle("/max_resource_limits", httperror.LoggerHandler(h.getKubernetesMaxResourceLimits)).Methods(http.MethodGet)
	endpointRouter.Handle("/metrics/applications_resources", httperror.LoggerHandler(h.getApplicationsResources)).Methods(http.MethodGet)
	endpointRouter.Handle("/metrics/nodes", httperror.LoggerHandler(h.getKubernetesMetricsForAllNodes)).Methods(http.MethodGet)
	endpointRouter.Handle("/metrics/nodes/{name}", httperror.LoggerHandler(h.getKubernetesMetricsForNode)).Methods(http.MethodGet)
	endpointRouter.Handle("/metrics/pods/namespace/{namespace}", httperror.LoggerHandler(h.getKubernetesMetricsForAllPods)).Methods(http.MethodGet)
	endpointRouter.Handle("/metrics/pods/namespace/{namespace}/{name}", httperror.LoggerHandler(h.getKubernetesMetricsForPod)).Methods(http.MethodGet)
	endpointRouter.Handle("/ingresscontrollers", httperror.LoggerHandler(h.getAllKubernetesIngressControllers)).Methods(http.MethodGet)
	endpointRouter.Handle("/ingresscontrollers", httperror.LoggerHandler(h.updateKubernetesIngressControllers)).Methods(http.MethodPut)
	endpointRouter.Handle("/ingresses/delete", httperror.LoggerHandler(h.deleteKubernetesIngresses)).Methods(http.MethodPost)
	endpointRouter.Handle("/ingresses", httperror.LoggerHandler(h.GetAllKubernetesClusterIngresses)).Methods(http.MethodGet)
	endpointRouter.Handle("/ingresses/count", httperror.LoggerHandler(h.getAllKubernetesClusterIngressesCount)).Methods(http.MethodGet)
	endpointRouter.Handle("/service_accounts", httperror.LoggerHandler(h.getAllKubernetesServiceAccounts)).Methods(http.MethodGet)
	endpointRouter.Handle("/services", httperror.LoggerHandler(h.GetAllKubernetesServices)).Methods(http.MethodGet)
	endpointRouter.Handle("/services/count", httperror.LoggerHandler(h.getAllKubernetesServicesCount)).Methods(http.MethodGet)
	endpointRouter.Handle("/secrets", httperror.LoggerHandler(h.GetAllKubernetesSecrets)).Methods(http.MethodGet)
	endpointRouter.Handle("/secrets/count", httperror.LoggerHandler(h.getAllKubernetesSecretsCount)).Methods(http.MethodGet)
	endpointRouter.Handle("/services/delete", httperror.LoggerHandler(h.deleteKubernetesServices)).Methods(http.MethodPost)
	endpointRouter.Handle("/rbac_enabled", httperror.LoggerHandler(h.getKubernetesRBACStatus)).Methods(http.MethodGet)
	endpointRouter.Handle("/roles", httperror.LoggerHandler(h.getAllKubernetesRoles)).Methods(http.MethodGet)
	endpointRouter.Handle("/role_bindings", httperror.LoggerHandler(h.getAllKubernetesRoleBindings)).Methods(http.MethodGet)
	endpointRouter.Handle("/namespaces", httperror.LoggerHandler(h.createKubernetesNamespace)).Methods(http.MethodPost)
	endpointRouter.Handle("/namespaces", httperror.LoggerHandler(h.updateKubernetesNamespace)).Methods(http.MethodPut)
	endpointRouter.Handle("/namespaces", httperror.LoggerHandler(h.deleteKubernetesNamespace)).Methods(http.MethodDelete)
	endpointRouter.Handle("/namespaces", httperror.LoggerHandler(h.getKubernetesNamespaces)).Methods(http.MethodGet)
	endpointRouter.Handle("/namespaces/count", httperror.LoggerHandler(h.getKubernetesNamespacesCount)).Methods(http.MethodGet)
	endpointRouter.Handle("/namespaces/{namespace}", httperror.LoggerHandler(h.getKubernetesNamespace)).Methods(http.MethodGet)
	endpointRouter.Handle("/volumes", httperror.LoggerHandler(h.GetAllKubernetesVolumes)).Methods(http.MethodGet)
	endpointRouter.Handle("/volumes/count", httperror.LoggerHandler(h.getAllKubernetesVolumesCount)).Methods(http.MethodGet)

	// namespaces
	// in the future this piece of code might be in another package (or a few different packages - namespaces/namespace?)
	// to keep it simple, we've decided to leave it like this.
	namespaceRouter := endpointRouter.PathPrefix("/namespaces/{namespace}").Subrouter()
	namespaceRouter.Handle("/configmaps/{configmap}", httperror.LoggerHandler(h.getKubernetesConfigMap)).Methods(http.MethodGet)
	namespaceRouter.Handle("/system", bouncer.RestrictedAccess(httperror.LoggerHandler(h.namespacesToggleSystem))).Methods(http.MethodPut)
	namespaceRouter.Handle("/ingresscontrollers", httperror.LoggerHandler(h.getKubernetesIngressControllersByNamespace)).Methods(http.MethodGet)
	namespaceRouter.Handle("/ingresscontrollers", httperror.LoggerHandler(h.updateKubernetesIngressControllersByNamespace)).Methods(http.MethodPut)
	namespaceRouter.Handle("/ingresses/{ingress}", httperror.LoggerHandler(h.getKubernetesIngress)).Methods(http.MethodGet)
	namespaceRouter.Handle("/ingresses", httperror.LoggerHandler(h.createKubernetesIngress)).Methods(http.MethodPost)
	namespaceRouter.Handle("/ingresses", httperror.LoggerHandler(h.updateKubernetesIngress)).Methods(http.MethodPut)
	namespaceRouter.Handle("/ingresses", httperror.LoggerHandler(h.getKubernetesIngresses)).Methods(http.MethodGet)
	namespaceRouter.Handle("/secrets/{secret}", httperror.LoggerHandler(h.getKubernetesSecret)).Methods(http.MethodGet)
	namespaceRouter.Handle("/services", httperror.LoggerHandler(h.createKubernetesService)).Methods(http.MethodPost)
	namespaceRouter.Handle("/services", httperror.LoggerHandler(h.updateKubernetesService)).Methods(http.MethodPut)
	namespaceRouter.Handle("/services", httperror.LoggerHandler(h.getKubernetesServicesByNamespace)).Methods(http.MethodGet)
	namespaceRouter.Handle("/volumes/{volume}", httperror.LoggerHandler(h.getKubernetesVolume)).Methods(http.MethodGet)

	return h
}

// getProxyKubeClient gets a kubeclient for the user.  It's generally what you want as it retrieves the kubeclient
// from the Authorization token of the currently logged in user.  The kubeclient that is not from the proxy is actually using
// admin permissions.  If you're unsure which one to use, use this.
func (h *Handler) getProxyKubeClient(r *http.Request) (*cli.KubeClient, *httperror.HandlerError) {
	endpointID, err := request.RetrieveNumericRouteVariableValue(r, "id")
	if err != nil {
		return nil, httperror.BadRequest(fmt.Sprintf("an error occurred during the getProxyKubeClient operation, the environment identifier route variable is invalid for /api/kubernetes/%d. Error: ", endpointID), err)
	}

	tokenData, err := security.RetrieveTokenData(r)
	if err != nil {
		return nil, httperror.Forbidden(fmt.Sprintf("an error occurred during the getProxyKubeClient operation, permission denied to access the environment /api/kubernetes/%d. Error: ", endpointID), err)
	}

	cli, ok := h.KubernetesClientFactory.GetProxyKubeClient(strconv.Itoa(endpointID), tokenData.Token)
	if !ok {
		return nil, httperror.InternalServerError("an error occurred during the getProxyKubeClient operation,failed to get proxy KubeClient", nil)
	}

	return cli, nil
}

// kubeClientMiddleware is a middleware that will create a kubeclient for the user if it doesn't exist
// and store it in the factory for future use.
// if there is a kubeclient against this auth token already, the existing one will be reused.
// otherwise, generate a new one
func (handler *Handler) kubeClientMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set(portainer.PortainerCacheHeader, "true")

		if handler.KubernetesClientFactory == nil {
			next.ServeHTTP(w, r)
			return
		}

		endpointID, err := request.RetrieveNumericRouteVariableValue(r, "id")
		if err != nil {
			httperror.WriteError(w, http.StatusBadRequest, fmt.Sprintf("an error occurred during the KubeClientMiddleware operation, the environment identifier route variable is invalid for /api/kubernetes/%d. Error: ", endpointID), err)
			return
		}

		tokenData, err := security.RetrieveTokenData(r)
		if err != nil {
			httperror.WriteError(w, http.StatusForbidden, "an error occurred during the KubeClientMiddleware operation, permission denied to access the environment. Error: ", err)
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
				httperror.WriteError(w, http.StatusNotFound,
					"an error occurred during the KubeClientMiddleware operation, unable to find an environment with the specified environment identifier inside the database. Error: ", err)
				return
			}

			httperror.WriteError(w, http.StatusInternalServerError, "an error occurred during the KubeClientMiddleware operation, error reading from the Portainer database. Error: ", err)
			return
		}

		user, err := security.RetrieveUserFromRequest(r, handler.DataStore)
		if err != nil {
			httperror.InternalServerError("an error occurred during the KubeClientMiddleware operation, unable to retrieve the user from request. Error: ", err)
			return
		}
		log.
			Debug().
			Str("context", "KubeClientMiddleware").
			Str("endpoint", endpoint.Name).
			Str("user", user.Username).
			Msg("Creating a Kubernetes client")

		isKubeAdmin := true
		nonAdminNamespaces := []string{}
		if user.Role != portainer.AdministratorRole {
			pcli, err := handler.KubernetesClientFactory.GetPrivilegedKubeClient(endpoint)
			if err != nil {
				httperror.WriteError(w, http.StatusInternalServerError, "an error occurred during the KubeClientMiddleware operation, unable to get privileged kube client to grab all namespaces. Error: ", err)
				return
			}

			nonAdminNamespaces, err = pcli.GetNonAdminNamespaces(int(user.ID), endpoint.Kubernetes.Configuration.RestrictDefaultNamespace)
			if err != nil {
				httperror.WriteError(w, http.StatusInternalServerError, "an error occurred during the KubeClientMiddleware operation, unable to retrieve non-admin namespaces. Error: ", err)
				return
			}
			isKubeAdmin = false
		}

		bearerToken, err := handler.JwtService.GenerateTokenForKubeconfig(tokenData)
		if err != nil {
			httperror.WriteError(w, http.StatusInternalServerError, "an error occurred during the KubeClientMiddleware operation, unable to generate token for kubeconfig. Error: ", err)
			return
		}

		config := handler.buildConfig(r, tokenData, bearerToken, []portainer.Endpoint{*endpoint}, true)
		if len(config.Clusters) == 0 {
			httperror.WriteError(w, http.StatusInternalServerError, "an error occurred during the KubeClientMiddleware operation, unable to build kubeconfig. Error: ", nil)
			return
		}

		// Manually setting serverURL to localhost to route the request to proxy server
		serverURL, err := url.Parse(config.Clusters[0].Cluster.Server)
		if err != nil {
			httperror.WriteError(w, http.StatusInternalServerError, "an error occurred during the KubeClientMiddleware operation, unable to parse server URL for building kubeconfig. Error: ", err)
			return
		}
		serverURL.Scheme = "https"
		serverURL.Host = "localhost" + handler.KubernetesClientFactory.AddrHTTPS
		config.Clusters[0].Cluster.Server = serverURL.String()

		yaml, err := cli.GenerateYAML(config)
		if err != nil {
			httperror.WriteError(w, http.StatusInternalServerError, "an error occurred during the KubeClientMiddleware operation, unable to generate kubeconfig YAML. Error: ", err)
			return
		}
		kubeCli, err := handler.KubernetesClientFactory.CreateKubeClientFromKubeConfig(endpoint.Name, []byte(yaml), isKubeAdmin, nonAdminNamespaces)
		if err != nil {
			httperror.WriteError(w, http.StatusInternalServerError, "an error occurred during the KubeClientMiddleware operation, unable to create kubernetes client from kubeconfig. Error: ", err)
			return
		}

		handler.KubernetesClientFactory.SetProxyKubeClient(strconv.Itoa(int(endpoint.ID)), tokenData.Token, kubeCli)
		next.ServeHTTP(w, r)
	})
}
