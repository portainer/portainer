package webhooks

import (
	"github.com/portainer/portainer/api/dataservices"
	"github.com/portainer/portainer/api/internal/authorization"
	"net/http"

	"github.com/gorilla/mux"
	httperror "github.com/portainer/libhttp/error"
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/docker"
	"github.com/portainer/portainer/api/http/security"
)

// Handler is the HTTP handler used to handle webhook operations.
type Handler struct {
	*mux.Router
	DataStore           dataservices.DataStore
	DockerClientFactory *docker.ClientFactory
}

// NewHandler creates a handler to manage webhooks operations.
func NewHandler(bouncer *security.RequestBouncer) *Handler {
	h := &Handler{
		Router: mux.NewRouter(),
	}
	h.Handle("/webhooks",
		bouncer.AuthenticatedAccess(httperror.LoggerHandler(h.webhookCreate))).Methods(http.MethodPost)
	h.Handle("/webhooks/{id}",
		bouncer.AuthenticatedAccess(httperror.LoggerHandler(h.webhookUpdate))).Methods(http.MethodPut)
	h.Handle("/webhooks",
		bouncer.AuthenticatedAccess(httperror.LoggerHandler(h.webhookList))).Methods(http.MethodGet)
	h.Handle("/webhooks/{id}",
		bouncer.AuthenticatedAccess(httperror.LoggerHandler(h.webhookDelete))).Methods(http.MethodDelete)
	h.Handle("/webhooks/{token}",
		bouncer.PublicAccess(httperror.LoggerHandler(h.webhookExecute))).Methods(http.MethodPost)
	return h
}

func (handler *Handler) checkResourceAccess(r *http.Request, endpoint *portainer.Endpoint, resourceID string, resourceControlType portainer.ResourceControlType) *httperror.HandlerError {
	// admins and endpoint admins
	securityContext, err := security.RetrieveRestrictedRequestContext(r)
	if err != nil {
		return &httperror.HandlerError{StatusCode: http.StatusInternalServerError, Message: "Unable to retrieve user info from request context", Err: err}
	}
	authService := authorization.NewService(handler.DataStore)
	isAdmin, err := authService.UserIsAdminOrEndpointAdmin(securityContext.UserID, endpoint.ID)
	if err != nil {
		return &httperror.HandlerError{StatusCode: http.StatusInternalServerError, Message: "Unable to get user role", Err: err}
	}
	if isAdmin {
		return nil
	}
	// non-admins
	rc, err := handler.DataStore.ResourceControl().ResourceControlByResourceIDAndType(resourceID, resourceControlType)
	if err != nil {
		return &httperror.HandlerError{StatusCode: http.StatusInternalServerError, Message: "Unable to retrieve a resource control associated to the resource", Err: err}
	}
	userTeamIDs := make([]portainer.TeamID, 0)
	for _, membership := range securityContext.UserMemberships {
		userTeamIDs = append(userTeamIDs, membership.TeamID)
	}
	canAccess := authorization.UserCanAccessResource(securityContext.UserID, userTeamIDs, rc)
	if !canAccess {
		return &httperror.HandlerError{StatusCode: http.StatusForbidden, Message: "This operation is disabled for non-admin users and unassigned access users"}
	}
	return nil
}
