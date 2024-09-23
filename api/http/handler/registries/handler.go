package registries

import (
	"net/http"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	"github.com/portainer/portainer/api/http/proxy"
	"github.com/portainer/portainer/api/http/security"
	"github.com/portainer/portainer/api/internal/endpointutils"
	"github.com/portainer/portainer/api/kubernetes"
	"github.com/portainer/portainer/api/kubernetes/cli"
	"github.com/portainer/portainer/api/pendingactions"
	httperror "github.com/portainer/portainer/pkg/libhttp/error"
	"github.com/portainer/portainer/pkg/libhttp/request"

	"github.com/gorilla/mux"

	"github.com/pkg/errors"
)

func hideFields(registry *portainer.Registry, hideAccesses bool) {
	registry.Password = ""
	registry.ManagementConfiguration = nil
	if hideAccesses {
		registry.RegistryAccesses = nil
	}
}

// Handler is the HTTP handler used to handle registry operations.
type Handler struct {
	*mux.Router
	requestBouncer        security.BouncerService
	DataStore             dataservices.DataStore
	FileService           portainer.FileService
	ProxyManager          *proxy.Manager
	K8sClientFactory      *cli.ClientFactory
	PendingActionsService *pendingactions.PendingActionsService
}

// NewHandler creates a handler to manage registry operations.
func NewHandler(bouncer security.BouncerService) *Handler {
	h := newHandler(bouncer)
	h.initRouter(bouncer)

	return h
}

func newHandler(bouncer security.BouncerService) *Handler {
	return &Handler{
		Router:         mux.NewRouter(),
		requestBouncer: bouncer,
	}
}

func (handler *Handler) initRouter(bouncer accessGuard) {
	adminRouter := handler.NewRoute().Subrouter()
	adminRouter.Use(bouncer.AdminAccess)

	authenticatedRouter := handler.NewRoute().Subrouter()
	authenticatedRouter.Use(bouncer.AuthenticatedAccess)

	adminRouter.Handle("/registries", httperror.LoggerHandler(handler.registryList)).Methods(http.MethodGet)
	adminRouter.Handle("/registries", httperror.LoggerHandler(handler.registryCreate)).Methods(http.MethodPost)
	adminRouter.Handle("/registries/{id}", httperror.LoggerHandler(handler.registryUpdate)).Methods(http.MethodPut)
	adminRouter.Handle("/registries/{id}/configure", httperror.LoggerHandler(handler.registryConfigure)).Methods(http.MethodPost)
	adminRouter.Handle("/registries/{id}", httperror.LoggerHandler(handler.registryDelete)).Methods(http.MethodDelete)

	authenticatedRouter.Handle("/registries/{id}", httperror.LoggerHandler(handler.registryInspect)).Methods(http.MethodGet)
	authenticatedRouter.PathPrefix("/registries/proxies/gitlab").Handler(httperror.LoggerHandler(handler.proxyRequestsToGitlabAPIWithoutRegistry))
}

type accessGuard interface {
	AdminAccess(h http.Handler) http.Handler
	AuthenticatedAccess(h http.Handler) http.Handler
	AuthorizedEndpointOperation(r *http.Request, endpoint *portainer.Endpoint) error
}

func (handler *Handler) registriesHaveSameURLAndCredentials(r1, r2 *portainer.Registry) bool {
	hasSameUrl := r1.URL == r2.URL
	hasSameCredentials := r1.Authentication == r2.Authentication && (!r1.Authentication || (r1.Authentication && r1.Username == r2.Username))

	if r1.Type != portainer.GitlabRegistry || r2.Type != portainer.GitlabRegistry {
		return hasSameUrl && hasSameCredentials
	}

	return hasSameUrl && hasSameCredentials && r1.Gitlab.ProjectPath == r2.Gitlab.ProjectPath
}

// this function validates that
//
// 1. user has the appropriate authorizations to perform the request
//
// 2. user has a direct or indirect access to the registry
func (handler *Handler) userHasRegistryAccess(r *http.Request, registry *portainer.Registry) (hasAccess bool, isAdmin bool, err error) {
	securityContext, err := security.RetrieveRestrictedRequestContext(r)
	if err != nil {
		return false, false, err
	}

	user, err := handler.DataStore.User().Read(securityContext.UserID)
	if err != nil {
		return false, false, err
	}

	// Portainer admins always have access to everything
	if securityContext.IsAdmin {
		return true, true, nil
	}

	// mandatory query param that should become a path param
	endpointIdStr, err := request.RetrieveNumericQueryParameter(r, "endpointId", false)
	if err != nil {
		return false, false, err
	}

	endpointId := portainer.EndpointID(endpointIdStr)

	endpoint, err := handler.DataStore.Endpoint().Endpoint(endpointId)
	if err != nil {
		return false, false, err
	}

	// validate that the request is allowed for the user (READ/WRITE authorization on request path)
	if err := handler.requestBouncer.AuthorizedEndpointOperation(r, endpoint); errors.Is(err, security.ErrAuthorizationRequired) {
		return false, false, nil
	} else if err != nil {
		return false, false, err
	}

	memberships, err := handler.DataStore.TeamMembership().TeamMembershipsByUserID(user.ID)
	if err != nil {
		return false, false, nil
	}

	// validate access for kubernetes namespaces (leverage registry.RegistryAccesses[endpointId].Namespaces)
	if endpointutils.IsKubernetesEndpoint(endpoint) {
		kcl, err := handler.K8sClientFactory.GetPrivilegedKubeClient(endpoint)
		if err != nil {
			return false, false, errors.Wrap(err, "unable to retrieve kubernetes client to validate registry access")
		}
		accessPolicies, err := kcl.GetNamespaceAccessPolicies()
		if err != nil {
			return false, false, errors.Wrap(err, "unable to retrieve environment's namespaces policies to validate registry access")
		}

		authorizedNamespaces := registry.RegistryAccesses[endpointId].Namespaces

		for _, namespace := range authorizedNamespaces {
			// when the default namespace is authorized to use a registry, all users have the ability to use it
			// unless the default namespace is restricted: in this case continue to search for other potential accesses authorizations
			if namespace == kubernetes.DefaultNamespace && !endpoint.Kubernetes.Configuration.RestrictDefaultNamespace {
				return true, false, nil
			}

			namespacePolicy := accessPolicies[namespace]
			if security.AuthorizedAccess(user.ID, memberships, namespacePolicy.UserAccessPolicies, namespacePolicy.TeamAccessPolicies) {
				return true, false, nil
			}
		}
		return false, false, nil
	}

	// validate access for docker environments
	// leverage registry.RegistryAccesses[endpointId].UserAccessPolicies (direct access)
	// and registry.RegistryAccesses[endpointId].TeamAccessPolicies (indirect access via his teams)
	if security.AuthorizedRegistryAccess(registry, user, memberships, endpoint.ID) {
		return true, false, nil
	}

	// when user has no access via their role, direct grant or indirect grant
	// then they don't have access to the registry
	return false, false, nil
}
