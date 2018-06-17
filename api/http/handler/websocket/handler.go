package websocket

import (
	"github.com/gorilla/mux"
	"github.com/gorilla/websocket"
	"github.com/portainer/portainer"
	httperror "github.com/portainer/portainer/http/error"
	"github.com/portainer/portainer/http/security"
)

// Handler is the HTTP handler used to handle websocket operations.
type Handler struct {
	*mux.Router
	EndpointService       portainer.EndpointService
	EndpointGroupService  portainer.EndpointGroupService
	TeamMembershipService portainer.TeamMembershipService
	SignatureService      portainer.DigitalSignatureService
	connectionUpgrader    websocket.Upgrader
}

// NewHandler creates a handler to manage websocket operations.
func NewHandler(bouncer *security.RequestBouncer) *Handler {
	h := &Handler{
		Router:             mux.NewRouter(),
		connectionUpgrader: websocket.Upgrader{},
	}
	h.PathPrefix("/websocket/exec").Handler(
		bouncer.AuthenticatedAccess(httperror.LoggerHandler(h.websocketExec)))
	return h
}

// TODO: should probable centralize this...
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
