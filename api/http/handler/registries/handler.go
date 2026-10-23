package registries

import (
	"net/http"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	httperrors "github.com/portainer/portainer/api/http/errors"
	"github.com/portainer/portainer/api/http/proxy"
	"github.com/portainer/portainer/api/http/security"
	"github.com/portainer/portainer/api/internal/registryutils/access"
	"github.com/portainer/portainer/api/kubernetes/cli"
	"github.com/portainer/portainer/api/pendingactions"
	httperror "github.com/portainer/portainer/pkg/libhttp/error"
	"github.com/portainer/portainer/pkg/libhttp/request"

	"github.com/gorilla/mux"

	"github.com/pkg/errors"
	"github.com/rs/zerolog/log"
)

func hideFields(registry *portainer.Registry, hideAccesses bool) {
	registry.Password = ""
	if registry.ManagementConfiguration != nil {
		// TLS and SkipTLSVerify should be retained since it's not sensitive information
		minimalManagementConfig := &portainer.RegistryManagementConfiguration{}
		minimalManagementConfig.TLSConfig = registry.ManagementConfiguration.TLSConfig
		registry.ManagementConfiguration = minimalManagementConfig
	}
	if hideAccesses {
		if registry.ManagementConfiguration != nil {
			registry.ManagementConfiguration.TLSConfig.TLSCACertPath = ""
			registry.ManagementConfiguration.TLSConfig.TLSCertPath = ""
			registry.ManagementConfiguration.TLSConfig.TLSKeyPath = ""
		}
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
	adminRouter.Handle("/registries", httperror.LoggerHandler(handler.registryList)).Methods(http.MethodGet)
	adminRouter.Handle("/registries", httperror.LoggerHandler(handler.registryCreate)).Methods(http.MethodPost)
	adminRouter.Handle("/registries/{id}", httperror.LoggerHandler(handler.registryUpdate)).Methods(http.MethodPut)
	adminRouter.Handle("/registries/{id}/configure", httperror.LoggerHandler(handler.registryConfigure)).Methods(http.MethodPost)
	adminRouter.Handle("/registries/{id}", httperror.LoggerHandler(handler.registryDelete)).Methods(http.MethodDelete)
	adminRouter.PathPrefix("/registries/proxies/gitlab").Handler(httperror.LoggerHandler(handler.proxyRequestsToGitlabAPIWithoutRegistry))

	// Use registry-specific access bouncer for inspect and repositories endpoints
	registryAccessRouter := handler.NewRoute().Subrouter()
	registryAccessRouter.Use(bouncer.AuthenticatedAccess, handler.RegistryAccess)
	registryAccessRouter.Handle("/registries/{id}", httperror.LoggerHandler(handler.registryInspect)).Methods(http.MethodGet)

	// Keep the gitlab proxy on the regular authenticated router as it doesn't require specific registry access
	authenticatedRouter := handler.NewRoute().Subrouter()
	authenticatedRouter.Use(bouncer.AuthenticatedAccess)
	authenticatedRouter.Handle("/registries/ping", httperror.LoggerHandler(handler.pingRegistry)).Methods(http.MethodPost)
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
// 1. user has the appropriate authorizations to perform the request
// 2. user has a direct or indirect access to the registry
func (handler *Handler) userHasRegistryAccess(r *http.Request, registry *portainer.Registry) (hasAccess bool, isAdmin bool, err error) {
	securityContext, err := security.RetrieveRestrictedRequestContext(r)
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

	// Use the enhanced registry access utility function that includes namespace validation
	_, err = access.GetAccessibleRegistry(
		handler.DataStore,
		handler.K8sClientFactory,
		securityContext.UserID,
		endpointId,
		registry.ID,
	)
	if err != nil {
		return false, false, nil // No access
	}

	return true, false, nil
}

// RegistryAccess defines a security check for registry-specific API endpoints.
// Authentication is required to access these endpoints.
// The user must have direct or indirect access to the specific registry being requested.
// This bouncer validates registry access using the userHasRegistryAccess logic.
func (handler *Handler) RegistryAccess(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// First ensure the user is authenticated
		tokenData, err := security.RetrieveTokenData(r)
		if err != nil {
			httperror.WriteError(w, http.StatusUnauthorized, "Authentication required", httperrors.ErrUnauthorized)
			return
		}

		// Extract registry ID from the route
		registryID, err := request.RetrieveNumericRouteVariableValue(r, "id")
		if err != nil {
			httperror.WriteError(w, http.StatusBadRequest, "Invalid registry identifier route variable", err)
			return
		}

		// Get the registry from the database
		registry, err := handler.DataStore.Registry().Read(portainer.RegistryID(registryID))
		if handler.DataStore.IsErrObjectNotFound(err) {
			httperror.WriteError(w, http.StatusNotFound, "Unable to find a registry with the specified identifier inside the database", err)
			return
		} else if err != nil {
			httperror.WriteError(w, http.StatusInternalServerError, "Unable to find a registry with the specified identifier inside the database", err)
			return
		}

		// Check if user has access to this registry
		hasAccess, _, err := handler.userHasRegistryAccess(r, registry)
		if err != nil {
			httperror.WriteError(w, http.StatusInternalServerError, "Unable to retrieve info from request context", err)
			return
		}
		if !hasAccess {
			log.Debug().
				Int("registry_id", registryID).
				Str("registry_name", registry.Name).
				Int("user_id", int(tokenData.ID)).
				Str("context", "RegistryAccessBouncer").
				Msg("User access denied to registry")
			httperror.WriteError(w, http.StatusForbidden, "Access denied to resource", httperrors.ErrResourceAccessDenied)
			return
		}

		next.ServeHTTP(w, r)
	})
}
