package registries

import (
	"fmt"
	"net/http"

	"github.com/gorilla/mux"
	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/http/proxy"
	"github.com/portainer/portainer/api/http/security"
	"github.com/portainer/portainer/api/internal/authorization"
)

func hideFields(registry *portainer.Registry) {
	registry.Password = ""
	registry.ManagementConfiguration = nil
}

// Handler is the HTTP handler used to handle registry operations.
type Handler struct {
	*mux.Router
	requestBouncer *security.RequestBouncer
	DataStore      portainer.DataStore
	FileService    portainer.FileService
	ProxyManager   *proxy.Manager
}

// NewHandler creates a handler to manage registry operations.
func NewHandler(bouncer *security.RequestBouncer) *Handler {
	h := &Handler{
		Router:         mux.NewRouter(),
		requestBouncer: bouncer,
	}

	h.Handle("/registries",
		bouncer.AdminAccess(httperror.LoggerHandler(h.registryCreate))).Methods(http.MethodPost)
	h.Handle("/registries",
		bouncer.RestrictedAccess(httperror.LoggerHandler(h.registryList))).Methods(http.MethodGet)
	h.Handle("/registries/{id}",
		bouncer.RestrictedAccess(httperror.LoggerHandler(h.registryInspect))).Methods(http.MethodGet)
	h.Handle("/registries/{id}",
		bouncer.AdminAccess(httperror.LoggerHandler(h.registryUpdate))).Methods(http.MethodPut)
	h.Handle("/registries/{id}/configure",
		bouncer.AdminAccess(httperror.LoggerHandler(h.registryConfigure))).Methods(http.MethodPost)
	h.Handle("/registries/{id}",
		bouncer.AdminAccess(httperror.LoggerHandler(h.registryDelete))).Methods(http.MethodDelete)
	h.PathPrefix("/registries/proxies/gitlab").Handler(
		bouncer.AdminAccess(httperror.LoggerHandler(h.proxyRequestsToGitlabAPIWithoutRegistry)))
	return h
}

func (handler *Handler) userIsAdmin(userID portainer.UserID) (bool, error) {
	user, err := handler.DataStore.User().User(userID)
	if err != nil {
		return false, err
	}

	isAdmin := user.Role == portainer.AdministratorRole

	return isAdmin, nil
}

func (handler *Handler) userIsAdminOrEndpointAdmin(user *portainer.User, endpointID portainer.EndpointID) (bool, error) {
	isAdmin := user.Role == portainer.AdministratorRole

	return isAdmin, nil
}

func (handler *Handler) userCanCreateRegistry(securityContext *security.RestrictedRequestContext, endpointID portainer.EndpointID) (bool, error) {
	user, err := handler.DataStore.User().User(securityContext.UserID)
	if err != nil {
		return false, err
	}

	return handler.userIsAdminOrEndpointAdmin(user, endpointID)
}

func (handler *Handler) userCanAccessRegistry(securityContext *security.RestrictedRequestContext, endpointID portainer.EndpointID, resourceControl *portainer.ResourceControl) (bool, error) {
	user, err := handler.DataStore.User().User(securityContext.UserID)
	if err != nil {
		return false, err
	}

	userTeamIDs := make([]portainer.TeamID, 0)
	for _, membership := range securityContext.UserMemberships {
		userTeamIDs = append(userTeamIDs, membership.TeamID)
	}

	if resourceControl != nil && authorization.UserCanAccessResource(securityContext.UserID, userTeamIDs, resourceControl) {
		return true, nil
	}

	return handler.userIsAdminOrEndpointAdmin(user, endpointID)
}

func (handler *Handler) computeRegistryResourceControlID(registryID portainer.RegistryID, endpointID portainer.EndpointID) string {
	return fmt.Sprintf("%d-%d", int(registryID), int(endpointID))
}

func (handler *Handler) filterRegistries(registries []portainer.Registry, resourceControls []portainer.ResourceControl, endpointID portainer.EndpointID) []portainer.Registry {
	if endpointID == 0 {
		return registries
	}

	filteredRegistries := make([]portainer.Registry, 0, len(registries))
	for _, registry := range registries {
		for _, resourceControl := range resourceControls {
			if resourceControl.ResourceID == handler.computeRegistryResourceControlID(registry.ID, endpointID) {
				filteredRegistries = append(filteredRegistries, registry)
			}
		}
	}

	return filteredRegistries
}
