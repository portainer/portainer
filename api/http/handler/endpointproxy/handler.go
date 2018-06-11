package endpointproxy

import (
	"github.com/gorilla/mux"
	"github.com/portainer/portainer"
	httperror "github.com/portainer/portainer/http/error"
	"github.com/portainer/portainer/http/proxy"
	"github.com/portainer/portainer/http/security"
)

// Handler is the HTTP handler used to proxy requests to external APIs.
type Handler struct {
	*mux.Router
	EndpointService       portainer.EndpointService
	EndpointGroupService  portainer.EndpointGroupService
	TeamMembershipService portainer.TeamMembershipService
	ProxyManager          *proxy.Manager
}

// NewHandler creates a handler to proxy requests to external APIs.
func NewHandler(bouncer *security.RequestBouncer) *Handler {
	h := &Handler{
		Router: mux.NewRouter(),
	}
	h.PathPrefix("/{id}/azure").Handler(
		bouncer.AuthenticatedAccess(httperror.LoggerHandler(h.proxyRequestsToAzureAPI)))
	h.PathPrefix("/{id}/docker").Handler(
		bouncer.AuthenticatedAccess(httperror.LoggerHandler(h.proxyRequestsToDockerAPI)))
	h.PathPrefix("/{id}/extensions/storidge").Handler(
		bouncer.AuthenticatedAccess(httperror.LoggerHandler(h.proxyRequestsToStoridgeAPI)))
	return h
}

func (handler *Handler) checkEndpointAccess(endpoint *portainer.Endpoint, userID portainer.UserID) error {
	memberships, err := handler.TeamMembershipService.TeamMembershipsByUserID(userID)
	if err != nil {
		return err
	}

	group, err := handler.EndpointGroupService.EndpointGroup(endpoint.GroupID)
	if err != nil {
		return err
	}

	if !security.AuthorizedEndpointAccess(endpoint, group, userID, memberships) {
		return portainer.ErrEndpointAccessDenied
	}

	return nil
}
