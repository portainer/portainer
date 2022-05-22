package users

import (
	"errors"

	httperror "github.com/portainer/libhttp/error"
	portainer "github.com/portainer/portainer/api"

	"github.com/portainer/portainer/api/apikey"
	"github.com/portainer/portainer/api/dataservices"
	"github.com/portainer/portainer/api/demo"
	"github.com/portainer/portainer/api/http/security"

	"net/http"

	"github.com/gorilla/mux"
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
	bouncer       *security.RequestBouncer
	apiKeyService apikey.APIKeyService
	demoService   *demo.Service
	DataStore     dataservices.DataStore
	CryptoService portainer.CryptoService
}

// NewHandler creates a handler to manage user operations.
func NewHandler(bouncer *security.RequestBouncer, rateLimiter *security.RateLimiter, apiKeyService apikey.APIKeyService, demoService *demo.Service) *Handler {
	h := &Handler{
		Router:        mux.NewRouter(),
		bouncer:       bouncer,
		apiKeyService: apiKeyService,
		demoService:   demoService,
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
	h.Handle("/users/{id}/tokens",
		bouncer.RestrictedAccess(httperror.LoggerHandler(h.userGetAccessTokens))).Methods(http.MethodGet)
	h.Handle("/users/{id}/tokens",
		rateLimiter.LimitAccess(bouncer.RestrictedAccess(httperror.LoggerHandler(h.userCreateAccessToken)))).Methods(http.MethodPost)
	h.Handle("/users/{id}/tokens/{keyID}",
		bouncer.RestrictedAccess(httperror.LoggerHandler(h.userRemoveAccessToken))).Methods(http.MethodDelete)
	h.Handle("/users/{id}/memberships",
		bouncer.RestrictedAccess(httperror.LoggerHandler(h.userMemberships))).Methods(http.MethodGet)
	h.Handle("/users/{id}/passwd",
		rateLimiter.LimitAccess(bouncer.AuthenticatedAccess(httperror.LoggerHandler(h.userUpdatePassword)))).Methods(http.MethodPut)
	h.Handle("/users/admin/check",
		bouncer.PublicAccess(httperror.LoggerHandler(h.adminCheck))).Methods(http.MethodGet)
	h.Handle("/users/admin/init",
		bouncer.PublicAccess(httperror.LoggerHandler(h.adminInit))).Methods(http.MethodPost)

	return h
}
