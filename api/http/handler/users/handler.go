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
	bouncer                 *security.RequestBouncer
	apiKeyService           apikey.APIKeyService
	demoService             *demo.Service
	DataStore               dataservices.DataStore
	CryptoService           portainer.CryptoService
	passwordStrengthChecker security.PasswordStrengthChecker
}

// NewHandler creates a handler to manage user operations.
func NewHandler(bouncer *security.RequestBouncer, rateLimiter *security.RateLimiter, apiKeyService apikey.APIKeyService, demoService *demo.Service, passwordStrengthChecker security.PasswordStrengthChecker) *Handler {
	h := &Handler{
		Router:                  mux.NewRouter(),
		bouncer:                 bouncer,
		apiKeyService:           apiKeyService,
		demoService:             demoService,
		passwordStrengthChecker: passwordStrengthChecker,
	}

	adminRouter := h.NewRoute().Subrouter()
	adminRouter.Use(bouncer.AdminAccess)

	teamLeaderRouter := h.NewRoute().Subrouter()
	teamLeaderRouter.Use(bouncer.TeamLeaderAccess)

	restrictedRouter := h.NewRoute().Subrouter()
	restrictedRouter.Use(bouncer.RestrictedAccess)

	authenticatedRouter := h.NewRoute().Subrouter()
	authenticatedRouter.Use(bouncer.AuthenticatedAccess)

	publicRouter := h.NewRoute().Subrouter()
	publicRouter.Use(bouncer.PublicAccess)

	adminRouter.Handle("/users", httperror.LoggerHandler(h.userCreate)).Methods(http.MethodPost)
	restrictedRouter.Handle("/users", httperror.LoggerHandler(h.userList)).Methods(http.MethodGet)
	restrictedRouter.Handle("/users/{id}", httperror.LoggerHandler(h.userInspect)).Methods(http.MethodGet)
	authenticatedRouter.Handle("/users/{id}", httperror.LoggerHandler(h.userUpdate)).Methods(http.MethodPut)
	adminRouter.Handle("/users/{id}", httperror.LoggerHandler(h.userDelete)).Methods(http.MethodDelete)
	restrictedRouter.Handle("/users/{id}/tokens", httperror.LoggerHandler(h.userGetAccessTokens)).Methods(http.MethodGet)
	restrictedRouter.Handle("/users/{id}/tokens", rateLimiter.LimitAccess(httperror.LoggerHandler(h.userCreateAccessToken))).Methods(http.MethodPost)
	restrictedRouter.Handle("/users/{id}/tokens/{keyID}", httperror.LoggerHandler(h.userRemoveAccessToken)).Methods(http.MethodDelete)
	restrictedRouter.Handle("/users/{id}/memberships", httperror.LoggerHandler(h.userMemberships)).Methods(http.MethodGet)
	authenticatedRouter.Handle("/users/{id}/passwd", rateLimiter.LimitAccess(httperror.LoggerHandler(h.userUpdatePassword))).Methods(http.MethodPut)
	publicRouter.Handle("/users/admin/check", httperror.LoggerHandler(h.adminCheck)).Methods(http.MethodGet)
	publicRouter.Handle("/users/admin/init", httperror.LoggerHandler(h.adminInit)).Methods(http.MethodPost)

	return h
}
