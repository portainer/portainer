package registries

import (
	"net/http"

	"github.com/gorilla/mux"
	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	"github.com/portainer/portainer/api/http/proxy"
	"github.com/portainer/portainer/api/http/security"
	"github.com/portainer/portainer/api/kubernetes/cli"
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
	requestBouncer   *security.RequestBouncer
	DataStore        dataservices.DataStore
	FileService      portainer.FileService
	ProxyManager     *proxy.Manager
	K8sClientFactory *cli.ClientFactory
}

// NewHandler creates a handler to manage registry operations.
func NewHandler(bouncer *security.RequestBouncer) *Handler {
	h := newHandler(bouncer)
	h.initRouter(bouncer)

	return h
}

func newHandler(bouncer *security.RequestBouncer) *Handler {
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

func (handler *Handler) userHasRegistryAccess(r *http.Request) (hasAccess bool, isAdmin bool, err error) {
	securityContext, err := security.RetrieveRestrictedRequestContext(r)
	if err != nil {
		return false, false, err
	}

	if securityContext.IsAdmin {
		return true, true, nil
	}

	endpointID, err := request.RetrieveNumericQueryParameter(r, "endpointId", false)
	if err != nil {
		return false, false, err
	}
	endpoint, err := handler.DataStore.Endpoint().Endpoint(portainer.EndpointID(endpointID))
	if err != nil {
		return false, false, err
	}

	err = handler.requestBouncer.AuthorizedEndpointOperation(r, endpoint)
	if err != nil {
		return false, false, err
	}

	return true, false, nil
}
