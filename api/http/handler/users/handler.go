package users

import (
	"errors"
	"net/http"

	"github.com/gorilla/mux"
	httperror "github.com/portainer/libhttp/error"
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/http/security"
	"github.com/portainer/portainer/api/internal/authorization"
	"github.com/portainer/portainer/api/kubernetes/cli"
)

var (
	errUserAlreadyExists          = errors.New("User already exists")
	errAdminAlreadyInitialized    = errors.New("An administrator user already exists")
	errAdminCannotRemoveSelf      = errors.New("Cannot remove your own user account. Contact another administrator")
	errCannotRemoveLastLocalAdmin = errors.New("Cannot remove the last local administrator account")
	errCryptoHashFailure          = errors.New("Unable to hash data")
)

func hideFields(user *portainer.User) {
	user.Password = ""
}

// Handler is the HTTP handler used to handle user operations.
type Handler struct {
	*mux.Router
	AuthorizationService *authorization.Service
	CryptoService        portainer.CryptoService
	DataStore            portainer.DataStore
	K8sClientFactory     *cli.ClientFactory
}

// NewHandler creates a handler to manage user operations.
func NewHandler(bouncer *security.RequestBouncer, rateLimiter *security.RateLimiter) *Handler {
	h := &Handler{
		Router: mux.NewRouter(),
	}
	h.Handle("/users",
		bouncer.AdminAccess(httperror.LoggerHandler(h.userCreate))).Methods(http.MethodPost)
	h.Handle("/users",
		bouncer.RestrictedAccess(httperror.LoggerHandler(h.userList))).Methods(http.MethodGet)
	h.Handle("/users/{id}",
		bouncer.RestrictedAccess(httperror.LoggerHandler(h.userInspect))).Methods(http.MethodGet)
	h.Handle("/users/{id}",
		bouncer.AuthenticatedAccess(httperror.LoggerHandler(h.userUpdate))).Methods(http.MethodPut)
	h.Handle("/users/{id}",
		bouncer.AdminAccess(httperror.LoggerHandler(h.userDelete))).Methods(http.MethodDelete)
	h.Handle("/users/{id}/memberships",
		bouncer.RestrictedAccess(httperror.LoggerHandler(h.userMemberships))).Methods(http.MethodGet)
	h.Handle("/users/{id}/passwd",
		rateLimiter.LimitAccess(bouncer.AuthenticatedAccess(httperror.LoggerHandler(h.userUpdatePassword)))).Methods(http.MethodPut)
	h.Handle("/users/admin/check",
		bouncer.PublicAccess(httperror.LoggerHandler(h.adminCheck))).Methods(http.MethodGet)
	h.Handle("/users/admin/init",
		bouncer.PublicAccess(httperror.LoggerHandler(h.adminInit))).Methods(http.MethodPost)
	h.Handle("/users/{id}/namespaces",
		bouncer.RestrictedAccess(httperror.LoggerHandler(h.userNamespaces))).Methods(http.MethodGet)

	return h
}
